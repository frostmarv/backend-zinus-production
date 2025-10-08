// src/pages/Cutting/InputCutting.jsx
import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  Settings,
  Package,
  Flame,
  Send,
  Plus,
  Trash2,
} from "lucide-react";
import { cuttingAPI } from "../../api/cutting"; // ✅ Import helper API
import "../../styles/Cutting/BalokCutting.css";

const InputCutting = () => {
  // Header Info
  const [headerData, setHeaderData] = useState({
    productionDate: new Date().toISOString().split("T")[0],
    shift: "1",
    machine: "Multi Cutting 1",
    operator: "",
    time: "08.00",
    noUrut: 1, // Auto-generated
    week: "",
  });

  // Data Balok (dinamis)
  const [balokData, setBalokData] = useState({
    density: "",
    ild: "",
    colour: "GR",
    length: "",
    width: "",
    height: "",
    sizeActual: "",
    qtyBalok: "",
  });

  // Data Actual (dinamis)
  const [actualData, setActualData] = useState([
    {
      id: 1,
      density: "",
      ild: "",
      colour: "GR",
      length: "",
      width: "",
      height: "",
      qtyBalok: "",
      qtyProduksi: "",
      reSize: "",
      jdfWeight: "",
      remark: "",
      descript: "FLAT",
    },
  ]);

  // Foaming Date
  const [foamingDate, setFoamingDate] = useState({
    isChecked: false,
    tanggalSelesai: "",
    jam: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate time slots
  const generateTimeOptions = () => {
    const slots = [];
    const startHour = headerData.shift === "1" ? 8 : 20;

    for (let i = 0; i < 12; i++) {
      const hour = (startHour + i) % 24;
      const formatHour = (h) => h.toString().padStart(2, "0");
      slots.push(`${formatHour(hour)}.00`);
    }

    return slots;
  };

  // Format week input
  const handleWeekChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    const numericValue = value.replace(/\D/g, "");
    setHeaderData((prev) => ({
      ...prev,
      week: numericValue,
    }));
  };

  // Tambah actual
  const addActual = () => {
    const newId =
      actualData.length > 0 ? Math.max(...actualData.map((a) => a.id)) + 1 : 1;
    setActualData((prev) => [
      ...prev,
      {
        id: newId,
        density: balokData.density,
        ild: balokData.ild,
        colour: balokData.colour,
        length: "",
        width: "",
        height: "",
        qtyBalok: "",
        qtyProduksi: "",
        reSize: "",
        jdfWeight: "",
        remark: "",
        descript: "FLAT",
      },
    ]);
  };

  // Hapus actual
  const removeActual = (id) => {
    if (actualData.length > 1) {
      setActualData((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // Update actual
  const updateActual = (id, field, value) => {
    setActualData((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  };

  // Calculate Total (Qty Produksi + Re-Size)
  const calculateTotal = (qtyProduksi, reSize) => {
    const qty = parseFloat(qtyProduksi) || 0;
    const resize = parseFloat(reSize) || 0;
    return qty + resize;
  };

  // Calculate Cutting Loss (%)
  const calculateCuttingLoss = (actualQty) => {
    const balokQty = parseFloat(balokData.qtyBalok) || 0;
    const actual = parseFloat(actualQty) || 0;

    if (balokQty === 0) return 0;

    const loss = ((balokQty - actual) / balokQty) * 100;
    return Math.max(0, loss); // Tidak boleh negatif
  };

  // Update balok
  const updateBalok = (field, value) => {
    setBalokData((prev) => ({ ...prev, [field]: value }));

    // Auto update density, ild, colour di semua actual data
    if (field === "density" || field === "ild" || field === "colour") {
      setActualData((prev) => prev.map((a) => ({ ...a, [field]: value })));
    }
  };

  // Handle submit ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // ✅ Payload FLAT — TIDAK ADA { header: ... }
    const dataToSend = {
      productionDate: headerData.productionDate,
      shift: headerData.shift,
      machine: headerData.machine,
      operator: headerData.operator,
      time: headerData.time,
      noUrut: headerData.noUrut,
      week: headerData.week || "",

      balok: {
        density: balokData.density || null,
        ild: balokData.ild || null,
        colour: balokData.colour,
        length: balokData.length ? Number(balokData.length) : null,
        width: balokData.width ? Number(balokData.width) : null,
        height: balokData.height ? Number(balokData.height) : null,
        sizeActual: balokData.sizeActual || null,
        qtyBalok: balokData.qtyBalok ? Number(balokData.qtyBalok) : null,
      },

      // ✅ Hapus .id & konversi number
      actual: actualData.map(({ id, ...a }) => ({
        density: a.density || null,
        ild: a.ild || null,
        colour: a.colour,
        length: a.length ? Number(a.length) : null,
        width: a.width ? Number(a.width) : null,
        height: a.height ? Number(a.height) : null,
        qtyBalok: a.qtyBalok ? Number(a.qtyBalok) : null,
        qtyProduksi: a.qtyProduksi ? Number(a.qtyProduksi) : null,
        reSize: a.reSize || null,
        jdfWeight: a.jdfWeight ? Number(a.jdfWeight) : null,
        remark: a.remark || null,
        descript: a.descript,
      })),

      // ✅ foamingDate struktur benar
      foamingDate: foamingDate.isChecked
        ? {
            isChecked: true,
            tanggalSelesai: foamingDate.tanggalSelesai || null,
            jam: foamingDate.jam || null,
          }
        : null,
    };

    try {
      // ✅ GUNAKAN HELPER API (TIDAK HARDCODE URL)
      await cuttingAPI.save(dataToSend);

      console.log("✅ Data berhasil disimpan:", dataToSend);
      alert("✅ Data berhasil disimpan ke server!");

      // Reset form with incremented noUrut
      setHeaderData({
        productionDate: new Date().toISOString().split("T")[0],
        shift: "1",
        machine: "Multi Cutting 1",
        operator: "",
        time: "08.00",
        noUrut: headerData.noUrut + 1, // Auto increment
        week: "",
      });

      setBalokData({
        density: "",
        ild: "",
        colour: "GR",
        length: "",
        width: "",
        height: "",
        sizeActual: "",
        qtyBalok: "",
      });

      setActualData([
        {
          id: 1,
          density: "",
          ild: "",
          colour: "GR",
          length: "",
          width: "",
          height: "",
          qtyBalok: "",
          qtyProduksi: "",
          reSize: "",
          jdfWeight: "",
          remark: "",
          descript: "FLAT",
        },
      ]);

      setFoamingDate({
        isChecked: false,
        tanggalSelesai: "",
        jam: "",
      });
    } catch (error) {
      console.error("🚨 Error koneksi ke backend:", error);
      alert(
        `❌ Error koneksi ke backend.\n` +
          `Pastikan:\n` +
          `1. Backend jalan di Replit\n` +
          `2. URL benar di .env\n` +
          `3. CORS tidak memblokir\n` +
          `Error: ${error.message}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cutting-container">
      <div className="cutting-header">
        <h1>Production Cutting Management</h1>
        <p>Advanced cutting data input system with premium features</p>
      </div>

      <form onSubmit={handleSubmit} className="cutting-form">
        {/* Header Info */}
        <div className="form-section">
          <h3>
            <Settings size={28} />
            Header Information
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Production Date</label>
              <input
                type="date"
                value={headerData.productionDate}
                onChange={(e) =>
                  setHeaderData((prev) => ({
                    ...prev,
                    productionDate: e.target.value,
                  }))
                }
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Shift</label>
              <select
                value={headerData.shift}
                onChange={(e) =>
                  setHeaderData((prev) => ({ ...prev, shift: e.target.value }))
                }
                className="form-input"
              >
                <option value="1">Shift 1</option>
                <option value="2">Shift 2</option>
              </select>
            </div>

            <div className="form-group">
              <label>Machine</label>
              <select
                value={headerData.machine}
                onChange={(e) =>
                  setHeaderData((prev) => ({
                    ...prev,
                    machine: e.target.value,
                  }))
                }
                className="form-input"
              >
                <option value="Multi Cutting 1">Multi Cutting 1</option>
                <option value="Multi Cutting 2">Multi Cutting 2</option>
                <option value="Rountable 1">Rountable 1</option>
                <option value="Rountable 2">Rountable 2</option>
                <option value="Rountable 3">Rountable 3</option>
                <option value="Rountable 4">Rountable 4</option>
              </select>
            </div>

            <div className="form-group">
              <label>Operator</label>
              <input
                type="text"
                value={headerData.operator}
                onChange={(e) =>
                  setHeaderData((prev) => ({
                    ...prev,
                    operator: e.target.value,
                  }))
                }
                placeholder="Enter operator name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Time</label>
              <select
                value={headerData.time}
                onChange={(e) =>
                  setHeaderData((prev) => ({
                    ...prev,
                    time: e.target.value,
                  }))
                }
                className="form-input"
              >
                {generateTimeOptions().map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>No Urut</label>
              <input
                type="text"
                value={headerData.noUrut}
                readOnly
                className="form-input readonly"
                style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
              />
            </div>

            <div className="form-group">
              <label>Week Number</label>
              <input
                type="text"
                value={headerData.week}
                onChange={handleWeekChange}
                placeholder="37"
                className="form-input"
                maxLength="2"
              />
            </div>
          </div>
        </div>

        {/* Data Balok */}
        <div className="form-section">
          <h3>
            <Package size={28} />
            Data Balok
          </h3>

          <div className="balok-card">
            <div className="form-grid">
              <div className="form-group">
                <label>Density</label>
                <input
                  type="text"
                  value={balokData.density}
                  onChange={(e) => updateBalok("density", e.target.value)}
                  placeholder="Enter density value"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Length</label>
                <input
                  type="number"
                  value={balokData.length}
                  onChange={(e) => updateBalok("length", e.target.value)}
                  placeholder="Length (mm)"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>ILD</label>
                <input
                  type="text"
                  value={balokData.ild}
                  onChange={(e) => updateBalok("ild", e.target.value)}
                  placeholder="Enter ILD value"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Width</label>
                <input
                  type="number"
                  value={balokData.width}
                  onChange={(e) => updateBalok("width", e.target.value)}
                  placeholder="Width (mm)"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Colour</label>
                <select
                  value={balokData.colour}
                  onChange={(e) => updateBalok("colour", e.target.value)}
                  className="form-input"
                >
                  <option value="GR">GR</option>
                  <option value="BE">BE</option>
                  <option value="BM">BM</option>
                  <option value="BM HD">BM HD</option>
                </select>
              </div>

              <div className="form-group">
                <label>Height</label>
                <input
                  type="number"
                  value={balokData.height}
                  onChange={(e) => updateBalok("height", e.target.value)}
                  placeholder="Height (mm)"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Size Actual</label>
                <input
                  type="text"
                  value={balokData.sizeActual}
                  onChange={(e) => updateBalok("sizeActual", e.target.value)}
                  placeholder="Actual size"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Qty Balok</label>
                <input
                  type="number"
                  value={balokData.qtyBalok}
                  onChange={(e) => updateBalok("qtyBalok", e.target.value)}
                  placeholder="Quantity"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Actual */}
        <div className="form-section">
          <h3>
            <Package size={28} />
            Data Actual
          </h3>

          {actualData.map((actual, index) => (
            <div key={actual.id} className="balok-card">
              <div className="balok-header">
                <h4>Actual #{index + 1}</h4>
                {actualData.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeActual(actual.id)}
                    className="btn-remove"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Density (Auto)</label>
                  <input
                    type="text"
                    value={actual.density}
                    readOnly
                    className="form-input readonly"
                    placeholder="Follows main data"
                  />
                </div>

                <div className="form-group">
                  <label>Length</label>
                  <input
                    type="number"
                    value={actual.length}
                    onChange={(e) =>
                      updateActual(actual.id, "length", e.target.value)
                    }
                    placeholder="Length (mm)"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>ILD (Auto)</label>
                  <input
                    type="text"
                    value={actual.ild}
                    readOnly
                    className="form-input readonly"
                    placeholder="Follows main data"
                  />
                </div>

                <div className="form-group">
                  <label>Width</label>
                  <input
                    type="number"
                    value={actual.width}
                    onChange={(e) =>
                      updateActual(actual.id, "width", e.target.value)
                    }
                    placeholder="Width (mm)"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Colour (Auto)</label>
                  <select
                    value={actual.colour}
                    disabled
                    className="form-input readonly"
                  >
                    <option value="GR">GR</option>
                    <option value="BE">BE</option>
                    <option value="BM">BM</option>
                    <option value="BM HD">BM HD</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Height</label>
                  <input
                    type="number"
                    value={actual.height}
                    onChange={(e) =>
                      updateActual(actual.id, "height", e.target.value)
                    }
                    placeholder="Height (mm)"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Qty Balok</label>
                  <input
                    type="number"
                    value={actual.qtyBalok}
                    onChange={(e) =>
                      updateActual(actual.id, "qtyBalok", e.target.value)
                    }
                    placeholder="Quantity"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Qty Produksi</label>
                  <input
                    type="number"
                    value={actual.qtyProduksi}
                    onChange={(e) =>
                      updateActual(actual.id, "qtyProduksi", e.target.value)
                    }
                    placeholder="Production quantity"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Re-Size</label>
                  <input
                    type="text"
                    value={actual.reSize}
                    onChange={(e) =>
                      updateActual(actual.id, "reSize", e.target.value)
                    }
                    placeholder="Re-size value"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>JDF Weight</label>
                  <input
                    type="number"
                    step="0.01"
                    value={actual.jdfWeight}
                    onChange={(e) =>
                      updateActual(actual.id, "jdfWeight", e.target.value)
                    }
                    placeholder="JDF weight (kg)"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Remark</label>
                  <textarea
                    value={actual.remark}
                    onChange={(e) =>
                      updateActual(actual.id, "remark", e.target.value)
                    }
                    placeholder="Additional remarks"
                    className="form-input"
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <select
                    value={actual.descript}
                    onChange={(e) =>
                      updateActual(actual.id, "descript", e.target.value)
                    }
                    className="form-input"
                  >
                    <option value="FLAT">FLAT</option>
                    <option value="HOLE">HOLE</option>
                  </select>

                  <div className="form-group">
                    <label>Total</label>
                    <input
                      type="number"
                      value={calculateTotal(actual.qtyProduksi, actual.reSize)}
                      readOnly
                      className="form-input readonly"
                      style={{ backgroundColor: "#e8f5e8", fontWeight: "bold" }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Cutting Loss (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={calculateCuttingLoss(actual.qtyBalok).toFixed(2)}
                      readOnly
                      className="form-input readonly"
                      style={{ backgroundColor: "#fff5e6", fontWeight: "bold" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="add-balok-section">
            <button type="button" onClick={addActual} className="btn-add">
              <Plus size={20} />
              Add Actual Data
            </button>
          </div>
        </div>

        {/* Foaming Date */}
        <div className="form-section">
          <h3>
            <Flame size={28} />
            Foaming Date
          </h3>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={foamingDate.isChecked}
                onChange={(e) =>
                  setFoamingDate((prev) => ({
                    ...prev,
                    isChecked: e.target.checked,
                  }))
                }
              />
              Is this a Foaming Date?
            </label>
          </div>

          {foamingDate.isChecked && (
            <div className="form-grid">
              <div className="form-group">
                <label>Completion Date</label>
                <input
                  type="date"
                  value={foamingDate.tanggalSelesai}
                  onChange={(e) =>
                    setFoamingDate((prev) => ({
                      ...prev,
                      tanggalSelesai: e.target.value,
                    }))
                  }
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={foamingDate.jam}
                  onChange={(e) =>
                    setFoamingDate((prev) => ({
                      ...prev,
                      jam: e.target.value,
                    }))
                  }
                  className="form-input"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            <Send size={24} />
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputCutting;
