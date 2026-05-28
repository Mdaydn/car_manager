import React, { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

function StockOut() {
  const navigate = useNavigate();

  const [spareParts, setSpareParts] = useState([]);

  const [form, setForm] = useState({
    spare_part_id: "",
    quantity: "",
    unitPrice: "",
  });

  // Load spare parts
  useEffect(() => {
    const fetchSpareParts = async () => {
      try {
        const res = await API.get("/spareparts");
        setSpareParts(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchSpareParts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await API.post("/stockout", form);
    alert(res.data.message);

    setForm({
      spare_part_id: "",
      quantity: "",
      unitPrice: "",
    });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER + BACK BUTTON */}
      <div className="flex items-center justify-between mb-6">

        <h2 className="text-3xl font-bold text-gray-800">
          ➖ Stock Out
        </h2>

        <button
          onClick={() => navigate(-1)}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
        >
          ⬅ Back
        </button>

      </div>

      {/* FORM CARD */}
      <div className="bg-white p-6 rounded shadow max-w-xl">

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* SELECT SPARE PART */}
          <select
            className="border p-2 rounded"
            value={form.spare_part_id}
            onChange={(e) =>
              setForm({ ...form, spare_part_id: e.target.value })
            }
          >
            <option value="">-- Select Spare Part --</option>

            {spareParts.map((part) => (
              <option key={part.id} value={part.id}>
                {part.id} - {part.name}
              </option>
            ))}
          </select>

          <input
            className="border p-2 rounded"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: e.target.value })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Unit Price"
            value={form.unitPrice}
            onChange={(e) =>
              setForm({ ...form, unitPrice: e.target.value })
            }
          />

          <button className="bg-red-600 text-white p-2 rounded hover:bg-red-500 transition">
            ➖ Remove Stock
          </button>

        </form>

      </div>
    </div>
  );
}

export default StockOut;