import React, { useState, useEffect } from "react";
import API from "../api";

function SparePart() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    unitPrice: "",
  });

  const fetchData = async () => {
    const res = await API.get("/spareparts");
    setData(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post("/spareparts", form);
    setForm({ name: "", category: "", unitPrice: "" });
    fetchData();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        🧩 Spare Parts Management
      </h2>

      {/* FORM CARD */}
      <div className="bg-white p-6 rounded shadow mb-8 max-w-xl">

        <h3 className="text-xl font-semibold mb-4">
          ➕ Add Spare Part
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          <input
            className="border p-2 rounded"
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Category"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          />

          <input
            type="number"
            className="border p-2 rounded"
            placeholder="Unit Price"
            value={form.unitPrice}
            onChange={(e) =>
              setForm({ ...form, unitPrice: e.target.value })
            }
          />

          <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500">
            Add Spare Part
          </button>

        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white p-6 rounded shadow">

        <h3 className="text-xl font-semibold mb-4">
          📦 Spare Parts List
        </h3>

        <table className="w-full text-left border-collapse">

          <thead>
            <tr className="border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">Price</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">

                <td className="p-2">{item.name}</td>
                <td className="p-2">{item.category}</td>
                <td className="p-2 text-green-600 font-bold">
                  {item.unitPrice}
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>
    </div>
  );
}

export default SparePart;