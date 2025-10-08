import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  Package,
  FileText,
  Hash,
  BarChart3,
  Plus,
  Trash2,
} from "lucide-react";
import "../../styles/Cutting/InputCutting.css";

const InputCutting = () => {
  const [headerData, setHeaderData] = useState({
    timestamp: new Date().toISOString().slice(0, 16),
    shift: "1",
    group: "A",
    time: "08:00",
  });

  const [formEntries, setFormEntries] = useState([
    {
      id: 1,
      customer: "",
      customerPO: "",
      poNumber: "",
      sku: "",
      sCode: "",
      quantityOrder: "",
      quantityProduksi: "",
      week: "",
      remainQuantity: 0,
    },
  ]);

  // Generate time options based on shift
  const getTimeOptions = (shift) => {
    const times = [];
    if (shift === "1") {
      // Shift 1: 08:00 - 20:00
      for (let hour = 8; hour <= 20; hour++) {
        const timeString = `${hour.toString().padStart(2, "0")}:00`;
        times.push(timeString);
      }
    } else {
      // Shift 2: 20:00 - 08:00 (next day)
      for (let hour = 20; hour <= 23; hour++) {
        const timeString = `${hour.toString().padStart(2, "0")}:00`;
        times.push(timeString);
      }
      for (let hour = 0; hour <= 8; hour++) {
        const timeString = `${hour.toString().padStart(2, "0")}:00`;
        times.push(timeString);
      }
    }
    return times;
  };

  // Handle header input changes
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeaderData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset time when shift changes
    if (name === "shift") {
      const newTimeOptions = getTimeOptions(value);
      setHeaderData((prev) => ({
        ...prev,
        shift: value,
        time: newTimeOptions[0] || "08:00",
      }));
    }
  };

  // Handle form entry input changes
  const handleFormEntryChange = (entryId, field, value) => {
    setFormEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === entryId) {
          const updatedEntry = { ...entry, [field]: value };

          // Calculate remain quantity
          if (field === "quantityOrder" || field === "quantityProduksi") {
            const qtyOrder =
              parseFloat(
                field === "quantityOrder" ? value : entry.quantityOrder,
              ) || 0;
            const qtyProd =
              parseFloat(
                field === "quantityProduksi" ? value : entry.quantityProduksi,
              ) || 0;
            updatedEntry.remainQuantity = qtyOrder - qtyProd;
          }

          return updatedEntry;
        }
        return entry;
      }),
    );
  };

  // Add new form entry
  const addFormEntry = () => {
    const newId = Math.max(...formEntries.map((entry) => entry.id)) + 1;
    const newEntry = {
      id: newId,
      customer: "",
      customerPO: "",
      poNumber: "",
      sku: "",
      sCode: "",
      quantityOrder: "",
      quantityProduksi: "",
      week: "",
      remainQuantity: 0,
    };
    setFormEntries((prev) => [...prev, newEntry]);
  };

  // Remove form entry
  const removeFormEntry = (entryId) => {
    if (formEntries.length > 1) {
      setFormEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      header: headerData,
      entries: formEntries,
    };
    console.log("Form submitted:", submitData);
    // Add your submission logic here
  };

  const timeOptions = getTimeOptions(headerData.shift);

  return (
    <div className="cutting-container">
      <div className="cutting-card">
        <div className="cutting-form-wrapper">
          {/* Header */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="cutting-form">
            {/* Header Information Section */}
            <div className="cutting-section">
              <div className="cutting-section-header">
                <h2 className="cutting-section-title">
                  <Calendar className="w-5 h-5" />
                  Header Information
                </h2>
              </div>

              <div className="cutting-header-grid">
                {/* Timestamp */}
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
                  />
                </div>

                {/* Shift */}
                <div className="cutting-field-group">
                  <label className="cutting-label">
                    <div className="cutting-label-icon">
                      <Clock />
                    </div>
                    Shift
                  </label>
                  <select
                    name="shift"
                    value={headerData.shift}
                    onChange={handleHeaderChange}
                    className="cutting-select"
                    required
                  >
                    <option value="1">Shift 1</option>
                    <option value="2">Shift 2</option>
                  </select>
                </div>

                {/* Group */}
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
                    required
                  >
                    <option value="A">Group A</option>
                    <option value="B">Group B</option>
                  </select>
                </div>

                {/* Time */}
                <div className="cutting-field-group">
                  <label className="cutting-label">
                    <div className="cutting-label-icon">
                      <Clock />
                    </div>
                    Time
                  </label>
                  <select
                    name="time"
                    value={headerData.time}
                    onChange={handleHeaderChange}
                    className="cutting-select"
                    required
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Form Information Section */}
            <div className="cutting-section">
              <div className="cutting-section-header">
                <h2 className="cutting-section-title">
                  <FileText className="w-5 h-5" />
                  Form Information
                </h2>
              </div>

              {/* Dynamic Form Entries */}
              {formEntries.map((entry, index) => (
                <div key={entry.id} className="cutting-form-entry">
                  <div className="cutting-form-entry-header">
                    <h3 className="cutting-entry-title">Entry {index + 1}</h3>
                    {formEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFormEntry(entry.id)}
                        className="cutting-remove-btn"
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
                      <input
                        type="text"
                        value={entry.customer}
                        onChange={(e) =>
                          handleFormEntryChange(
                            entry.id,
                            "customer",
                            e.target.value,
                          )
                        }
                        className="cutting-input"
                        placeholder="Enter customer name"
                        required
                      />
                    </div>

                    {/* Customer PO */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <FileText />
                        </div>
                        Customer PO
                      </label>
                      <input
                        type="text"
                        value={entry.customerPO}
                        onChange={(e) =>
                          handleFormEntryChange(
                            entry.id,
                            "customerPO",
                            e.target.value,
                          )
                        }
                        className="cutting-input"
                        placeholder="Enter customer PO"
                        required
                      />
                    </div>

                    {/* PO Number */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <Hash />
                        </div>
                        PO Number
                      </label>
                      <input
                        type="text"
                        value={entry.poNumber}
                        onChange={(e) =>
                          handleFormEntryChange(
                            entry.id,
                            "poNumber",
                            e.target.value,
                          )
                        }
                        className="cutting-input"
                        placeholder="Enter PO number"
                        required
                      />
                    </div>

                    {/* SKU */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <Package />
                        </div>
                        SKU
                      </label>
                      <input
                        type="text"
                        value={entry.sku}
                        onChange={(e) =>
                          handleFormEntryChange(entry.id, "sku", e.target.value)
                        }
                        className="cutting-input"
                        placeholder="Enter SKU"
                        required
                      />
                    </div>

                    {/* S.CODE */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <Hash />
                        </div>
                        S.CODE
                      </label>
                      <input
                        type="text"
                        value={entry.sCode}
                        onChange={(e) =>
                          handleFormEntryChange(
                            entry.id,
                            "sCode",
                            e.target.value,
                          )
                        }
                        className="cutting-input"
                        placeholder="Enter S.CODE"
                        required
                      />
                    </div>

                    {/* Quantity Order */}
                    <div className="cutting-field-group">
                      <label className="cutting-label">
                        <div className="cutting-label-icon">
                          <BarChart3 />
                        </div>
                        Quantity Order
                      </label>
                      <input
                        type="number"
                        value={entry.quantityOrder}
                        onChange={(e) =>
                          handleFormEntryChange(
                            entry.id,
                            "quantityOrder",
                            e.target.value,
                          )
                        }
                        className="cutting-input"
                        placeholder="Enter quantity order"
                        min="0"
                        step="1"
                        required
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
                        placeholder="Enter quantity produksi"
                        min="0"
                        step="1"
                        required
                      />
                    </div>

                    {/* Remain Quantity (Read-only) */}
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
                        className="cutting-input cutting-input-readonly"
                        placeholder="Auto calculated"
                        readOnly
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
                        onChange={(e) =>
                          handleFormEntryChange(
                            entry.id,
                            "week",
                            e.target.value,
                          )
                        }
                        className="cutting-input"
                        placeholder="Enter week number (e.g., 1, 2, 3)"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Entry Button */}
              <div className="cutting-add-entry-container">
                <button
                  type="button"
                  onClick={addFormEntry}
                  className="cutting-add-btn"
                >
                  <Plus className="w-4 h-4" />
                  Add Entry
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="cutting-submit-container">
              <button type="submit" className="cutting-submit-btn">
                Submit All Data
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InputCutting;
