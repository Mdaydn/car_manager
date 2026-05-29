import { useEffect, useState } from "react";
import axios from "axios";

export default function SurviceReport(){
    const[service,setservice]=useState([])

    useEffect(()=>{
        axios.get("http://localhost:5000/service")
        .then(res=>setservice(res.data))

    },[]);
    return(
        <div className="p-4">
  <div className="overflow-x-auto">
    <table className="min-w-full border border-gray-300 rounded-lg shadow-md bg-white">

      {/* HEADER */}
      <thead className="bg-blue-600 text-white">
        <tr>
          <th className="py-3 px-4 text-left">#</th>
          <th className="py-3 px-4 text-left">Service Name</th>
          <th className="py-3 px-4 text-left">Service Price</th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody className="divide-y divide-gray-200">
        {service.map((s, index) => (
          <tr
            key={s.serviceCode}
            className="hover:bg-gray-100 transition"
          >
            <td className="py-3 px-4">{index + 1}</td>
            <td className="py-3 px-4 font-medium">{s.serviceName}</td>
            <td className="py-3 px-4 text-green-600 font-semibold">
              {s.servicePrice}
            </td>
          </tr>
        ))}
      </tbody>

    </table>
  </div>
</div>
    )
}