import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Users,
  Package,
  FileText,
  Hash,
  BarChart3,
  Plus,
  Trash2,
} from "lucide-react";
import { masterDataAPI } from "../../api/masterData";
import { cuttingProductionAPI } from "../../api/cutting";
import "../../styles/Cutting/InputCutting.css";

const InputCutting = () => {
  const [headerData, setHeaderData] = useState({
    timestamp: new Date().toISOString().slice(0, 16),
    shift: "1",
    group: "A",
    time: "08:00",
    machine: "",
    operator: "",
  });

  const [formEntries, setFormEntries] = useState([
    {
      id: 1,
      customerId: "",
      poNumber: "",
      customerPO: "",
      sku: "",
      sCode: "",
      description: "",
      quantityOrder: "",
      quantityProduksi: "",
      week: "",
      remainQuantity: 0,
      plannedQtyCache: 0,
      // Cache untuk dropdown
      customers: [],
      poNumbers: [],
      customerPOs: [],
      skus: [],
      sCodes: [],
      sCodesData: [],
    },
  ]);

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Track baseline remain per unique CustomerPO+SKU+S.CODE combination (per layer)
  const [baseRemainByKey, setBaseRemainByKey] = useState({});

  // Helper: Generate unique key for CustomerPO+SKU+S.CODE combination (per layer)
  const computeKey = (entry) => {
    if (!entry.customerPO || !entry.sku) return null;
    // Include S.CODE untuk tracking per layer
    if (!entry.sCode) return null; // S.CODE harus ada untuk tracking remain
    return `${entry.customerPO}|${entry.sku}|${entry.sCode}`;
  };

  // Pure function: Recompute remain quantities for all entries
  const recomputeRemains = (entries, baseByKey) => {
    // Group entries by key and calculate total produced per key
    const totalProducedByKey = {};
    entries.forEach((entry) => {
      const key = computeKey(entry);
      if (key) {
        const qtyProd = Number(entry.quantityProduksi) || 0;
        totalProducedByKey[key] = (totalProducedByKey[key] || 0) + qtyProd;
      }
    });

    // Update each entry's remainQuantity
    return entries.map((entry) => {
      const key = computeKey(entry);
      if (!key) return entry;

      const baseRemain = baseByKey[key] || 0;
      const totalProduced = totalProducedByKey[key] || 0;
      const newRemain = baseRemain - totalProduced;

      return {
        ...entry,
        remainQuantity: newRemain,
      };
    });
  };

  // Load customers data
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await masterDataAPI.getCustomers();
        const data = Array.isArray(response) ? response : [];
        // Backend sudah mengembalikan format {value, label} yang benar
        setCustomers(data);
        setFormEntries((prev) =>
          prev.map((entry) => ({
            ...entry,
            customers: data,
          })),
        );
      } catch (err) {
        console.error("Gagal memuat data customers:", err);
        setError("Gagal memuat data customers");
        alert("❌ Gagal memuat data customers");
      } finally {
        setLoadingCustomers(false);
      }
    };
    loadCustomers();
  }, []);

  // Generate time options
  const getTimeOptions = (shift) => {
    const times = [];
    if (shift === "1") {
      for (let hour = 8; hour <= 20; hour++) {
        times.push(`${hour.toString().padStart(2, "0")}:00`);
      }
    } else {
      for (let hour = 20; hour <= 23; hour++) {
        times.push(`${hour.toString().padStart(2, "0")}:00`);
      }
      for (let hour = 0; hour <= 8; hour++) {
        times.push(`${hour.toString().padStart(2, "0")}:00`);
      }
    }
    return times;
  };

  // Handle header changes
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeaderData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "shift" && { time: getTimeOptions(value)[0] || "08:00" }),
    }));
  };

  // Memoized API calls
  const loadPoNumbers = useCallback(async (entryId, customerId) => {
    try {
      const response = await masterDataAPI.getPoNumbers(customerId);
      const data = Array.isArray(response) ? response : [];
      // Backend mungkin sudah mengembalikan format {value, label}
      setFormEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, poNumbers: data } : entry,
        ),
      );
    } catch (err) {
      console.error("Gagal memuat PO Numbers:", err);
      alert("❌ Gagal memuat PO Numbers");
    }
  }, []);

  const loadCustomerPOs = useCallback(async (entryId, poNumber) => {
    try {
      const response = await masterDataAPI.getCustomerPOs(poNumber);
      const data = Array.isArray(response) ? response : [];
      // Backend mungkin sudah mengembalikan format {value, label}
      setFormEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, customerPOs: data } : entry,
        ),
      );
    } catch (err) {
      console.error("Gagal memuat Customer POs:", err);
      alert("❌ Gagal memuat Customer POs");
    }
  }, []);

  const loadSkus = useCallback(async (entryId, customerPo) => {
    try {
      const response = await masterDataAPI.getSkus(customerPo);
      const data = Array.isArray(response) ? response : [];
      // Backend mungkin sudah mengembalikan format {value, label}
      setFormEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, skus: data } : entry,
        ),
      );
    } catch (err) {
      console.error("Gagal memuat SKUs:", err);
      alert("❌ Gagal memuat SKUs");
    }
  }, []);

  const loadQtyPlans = useCallback(async (entryId, customerPo, sku) => {
    try {
      const response = await masterDataAPI.getQtyPlans(customerPo, sku);
      const rawData = Array.isArray(response) ? response : [];
      // Backend mengembalikan [{value, label, f_code, s_codes: [{s_code, description}]}]
      const qtyValue = rawData.length > 0 && rawData[0].value !== undefined 
        ? rawData[0].value 
        : "";
      
      // Extract s_codes dari response
      const sCodesRaw = rawData.length > 0 && rawData[0].s_codes 
        ? rawData[0].s_codes 
        : [];
      
      // Transform s_codes untuk dropdown format {value, label}
      const sCodesOptions = sCodesRaw.map((item) => ({
        value: item.s_code,
        label: item.s_code,
      }));
      
      const plannedQty = Number(qtyValue) || 0;
      
      // Update entries dengan qty dan s_codes data
      setFormEntries((prevEntries) => {
        return prevEntries.map((entry) => {
          if (entry.id !== entryId) return entry;
          
          return {
            ...entry,
            quantityOrder: qtyValue.toString(),
            sCodes: sCodesOptions,
            sCodesData: sCodesRaw,
            plannedQtyCache: plannedQty, // Cache planned qty untuk digunakan saat S.CODE dipilih
          };
        });
      });
    } catch (err) {
      console.error("Gagal memuat Qty Plans:", err);
      alert("❌ Gagal memuat Qty Plans");
    }
  }, []);

  const loadWeeks = useCallback(async (entryId, customerPo, sku) => {
    try {
      const response = await masterDataAPI.getWeeks(customerPo, sku);
      const rawData = Array.isArray(response) ? response : [];
      // Backend mengembalikan [{value, label}], ambil .value saja
      const weekValue = rawData.length > 0 && rawData[0].value !== undefined 
        ? rawData[0].value 
        : "";
      setFormEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                week: weekValue.toString(),
              }
            : entry,
        ),
      );
    } catch (err) {
      console.error("Gagal memuat Weeks:", err);
      alert("❌ Gagal memuat Weeks");
    }
  }, []);

  // Handle form entry changes with cascading logic
  const handleFormEntryChange = async (id, field, value) => {
    setFormEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;

        let updated = { ...entry, [field]: value };

        if (field === "customerId") {
          updated.poNumber = "";
          updated.customerPO = "";
          updated.sku = "";
          updated.sCode = "";
          updated.description = "";
          updated.quantityOrder = "";
          updated.quantityProduksi = "";
          updated.week = "";
          updated.remainQuantity = 0;
          updated.poNumbers = [];
          updated.customerPOs = [];
          updated.skus = [];
          updated.sCodes = [];
          updated.sCodesData = [];

          if (value) {
            loadPoNumbers(id, value);
          }
        } else if (field === "poNumber") {
          updated.customerPO = "";
          updated.sku = "";
          updated.sCode = "";
          updated.description = "";
          updated.quantityOrder = "";
          updated.quantityProduksi = "";
          updated.week = "";
          updated.remainQuantity = 0;
          updated.customerPOs = [];
          updated.skus = [];
          updated.sCodes = [];
          updated.sCodesData = [];

          if (value) {
            loadCustomerPOs(id, value);
          }
        } else if (field === "customerPO") {
          updated.sku = "";
          updated.sCode = "";
          updated.description = "";
          updated.quantityOrder = "";
          updated.quantityProduksi = "";
          updated.week = "";
          updated.remainQuantity = 0;
          updated.skus = [];
          updated.sCodes = [];
          updated.sCodesData = [];

          if (value) {
            loadSkus(id, value);
          }
        } else if (field === "sku") {
          updated.quantityOrder = "";
          updated.quantityProduksi = "";
          updated.week = "";
          updated.sCode = "";
          updated.description = "";
          updated.remainQuantity = 0;
          updated.sCodes = [];
          updated.sCodesData = [];

          if (value && updated.customerPO) {
            loadQtyPlans(id, updated.customerPO, value);
            loadWeeks(id, updated.customerPO, value);
          }
        } else if (field === "sCode") {
          // Find description dari sCodesData berdasarkan selected sCode
          const selectedSCode = entry.sCodesData?.find(
            (item) => item.s_code === value
          );
          updated.description = selectedSCode?.description || "";
          
          // Jika S.CODE di-clear, reset remainQuantity
          if (!value) {
            updated.remainQuantity = 0;
          }
        }

        return updated;
      }),
    );
    
    // Handle S.CODE selection: set baseline remain per layer dan recompute
    if (field === "sCode") {
      setFormEntries((prev) => {
        // Find current entry untuk get planned qty
        const currentEntry = prev.find((e) => e.id === id);
        if (currentEntry && currentEntry.customerPO && currentEntry.sku && value) {
          const key = `${currentEntry.customerPO}|${currentEntry.sku}|${value}`;
          const plannedQty = currentEntry.plannedQtyCache || 0;
          
          // Set baseline remain untuk layer ini dan recompute atomically
          setBaseRemainByKey((prevBase) => {
            const nextBase = prevBase[key] === undefined 
              ? { ...prevBase, [key]: plannedQty }
              : prevBase;
            
            // Recompute with updated baseline (menggunakan prev yang sudah updated dengan sCode)
            setFormEntries((entries) => recomputeRemains(entries, nextBase));
            
            return nextBase;
          });
        }
        
        return prev;
      });
    }
    
    // Recompute all remains when quantityProduksi changes
    if (field === "quantityProduksi") {
      setFormEntries((prev) => recomputeRemains(prev, baseRemainByKey));
    }
  };

  // Add/remove entries
  const addFormEntry = () => {
    const newId = formEntries.length
      ? Math.max(...formEntries.map((e) => e.id)) + 1
      : 1;
    setFormEntries((prev) => [
      ...prev,
      {
        id: newId,
        customerId: "",
        poNumber: "",
        customerPO: "",
        sku: "",
        sCode: "",
        description: "",
        quantityOrder: "",
        quantityProduksi: "",
        week: "",
        remainQuantity: 0,
        plannedQtyCache: 0,
        customers: customers,
        poNumbers: [],
        customerPOs: [],
        skus: [],
        sCodes: [],
        sCodesData: [],
      },
    ]);
  };

  const removeFormEntry = (id) => {
    if (formEntries.length > 1) {
      setFormEntries((prev) => {
        const filtered = prev.filter((e) => e.id !== id);
        // Recompute remains after removing entry
        return recomputeRemains(filtered, baseRemainByKey);
      });
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const submitData = {
      timestamp: new Date(headerData.timestamp).toISOString(),
      shift: headerData.shift,
      group: headerData.group,
      time: headerData.time,
      machine: headerData.machine,
      operator: headerData.operator,
      entries: formEntries.map(
        ({
          id,
          customers,
          poNumbers,
          customerPOs,
          skus,
          sCodes,
          sCodesData,
          plannedQtyCache,
          ...entry
        }) => {
          const customerName =
            customers.find((c) => c.value == entry.customerId)?.label || ""; // Use .value and .label
          return {
            customer: customerName,
            poNumber: entry.poNumber,
            customerPO: entry.customerPO,
            sku: entry.sku,
            sCode: entry.sCode,
            description: entry.description,
            quantityOrder: Number(entry.quantityOrder) || 0,
            quantityProduksi: Number(entry.quantityProduksi) || 0,
            week: entry.week,
            remainQuantity: Number(entry.remainQuantity) || 0,
          };
        },
      ),
    };

    try {
      console.log("Submitting data:", submitData);
      
      // Kirim data ke backend API
      const response = await cuttingProductionAPI.save(submitData);
      console.log("Response dari server:", response);
      
      alert("✅ Data berhasil disimpan ke database!");

      // Reset form setelah berhasil submit
      setHeaderData({
        timestamp: new Date().toISOString().slice(0, 16),
        shift: "1",
        group: "A",
        time: "08:00",
      });
      setFormEntries([
        {
          id: 1,
          customerId: "",
          poNumber: "",
          customerPO: "",
          sku: "",
          sCode: "",
          description: "",
          quantityOrder: "",
          quantityProduksi: "",
          week: "",
          remainQuantity: 0,
          plannedQtyCache: 0,
          customers: customers,
          poNumbers: [],
          customerPOs: [],
          skus: [],
          sCodes: [],
          sCodesData: [],
        },
      ]);
      // Reset baseline remain tracking
      setBaseRemainByKey({});
    } catch (err) {
      console.error("Error submitting data:", err);
      const msg = err.message || "Terjadi kesalahan saat menyimpan data";
      setError(msg);
      alert(`❌ Gagal menyimpan data: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeOptions = getTimeOptions(headerData.shift);

  return (
    <div className="cutting-container">
      <div className="cutting-card">
        <div className="cutting-form-wrapper">
          <div className="cutting-header">
            <h1 className="cutting-title">
              <div className="cutting-title-icon">
                <Package className="w-7 h-7" />
              </div>
              Input Data Cutting
            </h1>
            <p className="cutting-subtitle">
              Masukkan data produksi cutting dengan lengkap dan akurat
            </p>
          </div>

          {error && <div className="cutting-error-banner">❌ {error}</div>}

          <form onSubmit={handleSubmit} className="cutting-form">
            {/* Header Section */}
            <div className="cutting-section">
              <div className="cutting-section-header">
                <h2 className="cutting-section-title">
                  <Calendar className="w-5 h-5" /> Header Information
                </h2>
              </div>
              <div className="cutting-header-grid">
                <div className="cutting-field-group">
                  <label className="cutting-label">
                    <div className="cutting-label-icon">
                      <Calendar />
                    </div>
                    Timestamp
                  </label>
                  <input
                    type="datetime-local"
                    name="timestamp"
                    value={headerData.timestamp}
                    onChange={handleHeaderChange}
                    className="cutting-input"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="cutting-field-group">
                  <label className="cutting-label">
                    <div className="cutting-label-icon">
                      <Users />
                    </div>
                    Shift
                  </label>
                  <select
                    name="shift"
                    value={headerData.shift}
                    onChange={handleHeaderChange}
                    className="cutting-select"
                    disabled={isSubmitting}
                  >
                    <option value="1">Shift 1</option>
                    <option value="2">Shift 2</option>
                  </select>
                </div>
                <div className="cutting-field-group">
                  <label className="cutting-label">
                    <div className="cutting-label-icon">
                      <Users />
                    </div>
                    Group
                  </label>
                  <select
                    name="group"
                    value={headerData.group}
                    onChange={handleHeaderChange}
                    className="cutting-select"
                    disabled={isSubmitting}
                  >
                    <option value="A">Group A</option>
                    <option value="B">Group B</option>
                  </select>
                </div>
                <div className="cutting-field-group">
                  <label className="cutting-label">
                    <div className="cutting-label-icon">
                      <Calendar />
                    </div>
                    Time
                  </label>
                  <select
                    name="time"
                    value={headerData.time}
                    onChange={handleHeaderChange}
                    className="cutting-select"
                    disabled={isSubmitting}
                  >
                    {timeOptions.map((time, index) => (
                      <option
                        key={`time-${headerData.shift}-${time}`}
                        value={time}
                      >
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cutting-field-group">
                  <label className="cutting-label">
                    <div className="cutting-label-icon">
                      <Package />
                    </div>
                    Machine
                  </label>
                  <select
                    name="machine"
                    value={headerData.machine}
                    onChange={handleHeaderChange}
                    className="cutting-select"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Pilih Machine</option>
                    <option value="Multi Cutting 1">Multi Cutting 1</option>
                    <option value="Multi Cutting 2">Multi Cutting 2</option>
                    <option value="Rountable 1">Rountable 1</option>
                    <option value="Rountable 2">Rountable 2</option>
                    <option value="Rountable 3">Rountable 3</option>
                    <option value="Rountable 4">Rountable 4</option>
                    <option value="Vertikal 1">Vertikal 1</option>
                    <option value="Vertikal 2">Vertikal 2</option>
                    <option value="Vertikal 3">Vertikal 3</option>
                  </select>
                </div>
                <div className="cutting-field-group">
                  <label className="cutting-label">
                    <div className="cutting-label-icon">
                      <Users />
                    </div>
                    Nama Operator
                  </label>
                  <input
                    type="text"
                    name="operator"
                    value={headerData.operator}
                    onChange={handleHeaderChange}
                    className="cutting-input"
                    placeholder="Masukkan nama operator"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Form Entries */}
            <div className="cutting-section">
              <div className="cutting-section-header">
                <h2 className="cutting-section-title">
                  <FileText className="w-5 h-5" /> Form Information
                </h2>
              </div>

              {formEntries.map((entry, idx) => (
                <div key={entry.id} className="cutting-form-entry">
                  <div className="cutting-form-entry-header">
                    {formEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFormEntry(entry.id)}
                        className="cutting-remove-btn"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="cutting-grid">
                    {/* Customer */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <Users />
                        </div>
                        Customer
                      </label>
                      <select
                        value={entry.customerId}
                        onChange={(e) =>
                          handleFormEntryChange(
                            entry.id,
                            "customerId",
                            e.target.value,
                          )
                        }
                        className="cutting-select"
                        required
                        disabled={isSubmitting || loadingCustomers}
                      >
                        <option value="">Pilih Customer</option>
                        {(entry.customers || []).map((customer, idx) => (
                          <option
                            key={`customer-${entry.id}-${customer.value || idx}`}
                            value={customer.value}
                          >
                            {customer.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* PO Number */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <Hash />
                        </div>
                        PO Number
                      </label>
                      <select
                        value={entry.poNumber}
                        onChange={(e) =>
                          handleFormEntryChange(
                            entry.id,
                            "poNumber",
                            e.target.value,
                          )
                        }
                        className="cutting-select"
                        required
                        disabled={!entry.customerId || isSubmitting}
                      >
                        <option value="">Pilih PO Number</option>
                        {(entry.poNumbers || []).map((po, idx) => (
                          <option
                            key={`po-${entry.id}-${po.value || idx}`}
                            value={po.value}
                          >
                            {po.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Customer PO */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <FileText />
                        </div>
                        Customer PO
                      </label>
                      <select
                        value={entry.customerPO}
                        onChange={(e) =>
                          handleFormEntryChange(
                            entry.id,
                            "customerPO",
                            e.target.value,
                          )
                        }
                        className="cutting-select"
                        required
                        disabled={!entry.poNumber || isSubmitting}
                      >
                        <option value="">Pilih Customer PO</option>
                        {(entry.customerPOs || []).map((po, idx) => (
                          <option
                            key={`customerpo-${entry.id}-${po.value || idx}`}
                            value={po.value}
                          >
                            {po.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SKU */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <Package />
                        </div>
                        SKU
                      </label>
                      <select
                        value={entry.sku}
                        onChange={(e) =>
                          handleFormEntryChange(entry.id, "sku", e.target.value)
                        }
                        className="cutting-select"
                        required
                        disabled={!entry.customerPO || isSubmitting}
                      >
                        <option value="">Pilih SKU</option>
                        {(entry.skus || []).map((sku, idx) => (
                          <option
                            key={`sku-${entry.id}-${sku.value || idx}`}
                            value={sku.value}
                          >
                            {sku.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* S.CODE */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <Hash />
                        </div>
                        S.CODE
                      </label>
                      <select
                        value={entry.sCode}
                        onChange={(e) =>
                          handleFormEntryChange(
                            entry.id,
                            "sCode",
                            e.target.value,
                          )
                        }
                        className="cutting-select"
                        required={(entry.sCodes || []).length > 0}
                        disabled={!entry.sku || (entry.sCodes || []).length === 0 || isSubmitting}
                      >
                        <option value="">
                          {(entry.sCodes || []).length === 0 
                            ? "Tidak ada S.CODE" 
                            : "Pilih S.CODE"}
                        </option>
                        {(entry.sCodes || []).map((sCode, idx) => (
                          <option
                            key={`scode-${entry.id}-${sCode.value || idx}`}
                            value={sCode.value}
                          >
                            {sCode.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <FileText />
                        </div>
                        Description
                      </label>
                      <input
                        type="text"
                        value={entry.description}
                        readOnly
                        className="cutting-input cutting-input-readonly"
                        placeholder="Auto-fill ketika S.CODE dipilih"
                        disabled
                      />
                    </div>

                    {/* Quantity Order */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <BarChart3 />
                        </div>
                        Quantity Order (Planned Qty)
                      </label>
                      <input
                        type="number"
                        value={entry.quantityOrder}
                        readOnly
                        className="cutting-input cutting-input-readonly"
                        placeholder="Auto-fill ketika SKU dipilih"
                        disabled
                      />
                    </div>

                    {/* Quantity Produksi */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <BarChart3 />
                        </div>
                        Quantity Produksi
                      </label>
                      <input
                        type="number"
                        value={entry.quantityProduksi}
                        onChange={(e) =>
                          handleFormEntryChange(
                            entry.id,
                            "quantityProduksi",
                            e.target.value,
                          )
                        }
                        className="cutting-input"
                        min="0"
                        step="1"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Remain Quantity */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <BarChart3 />
                        </div>
                        Remain Quantity
                      </label>
                      <input
                        type="number"
                        value={entry.remainQuantity}
                        readOnly
                        className="cutting-input cutting-input-readonly"
                        disabled
                      />
                    </div>

                    {/* Week */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <Calendar />
                        </div>
                        Week
                      </label>
                      <input
                        type="text"
                        value={entry.week}
                        readOnly
                        className="cutting-input cutting-input-readonly"
                        placeholder="Auto-fill ketika SKU dipilih"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="cutting-add-entry-container">
                <button
                  type="button"
                  onClick={addFormEntry}
                  className="cutting-add-btn"
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4" /> Add Entry
                </button>
              </div>
            </div>

            <div className="cutting-submit-container">
              <button
                type="submit"
                className="cutting-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit All Data"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InputCutting;
