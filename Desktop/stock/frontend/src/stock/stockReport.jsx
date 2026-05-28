import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

function StockReport({ token }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get(`${API}/report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setData(res.data));
  }, [token]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        📊 Stock Report
      </h2>

      {/* TABLE CARD */}
      <div className="bg-white p-6 rounded shadow">

        <table className="w-full text-left border-collapse">

          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Stock In</th>
              <th className="p-3">Stock Out</th>
              <th className="p-3">Remaining</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">

                <td className="p-3 font-medium">
                  {item.name}
                </td>

                <td className="p-3 text-gray-600">
                  {item.category}
                </td>

                <td className="p-3 text-green-600 font-semibold">
                  {item.total_stock_in}
                </td>

                <td className="p-3 text-red-600 font-semibold">
                  {item.total_stock_out}
                </td>

                {/* STATUS COLOR */}
                <td className="p-3 font-bold">
                  <span
                    className={
                      item.remaining_stock <= 5
                        ? "text-red-600"
                        : item.remaining_stock <= 15
                        ? "text-yellow-600"
                        : "text-green-600"
                    }
                  >
                    {item.remaining_stock}
                  </span>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>
    </div>
  );
}

export default StockReport;