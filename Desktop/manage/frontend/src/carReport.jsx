import { useEffect, useState } from "react";
import axios from "axios";

export default function Carreport(){
    const[car,setcar]=useState([])

    useEffect(()=>{
        axios.get("http://localhost:5000/car")
        .then(res=>setcar(res.data))

    },[]);
    return(
        <div className="p-4">
  <div className="overflow-x-auto">
    <table className="min-w-full border border-gray-300 rounded-lg shadow-md bg-white">

      {/* HEADER */}
      <thead className="bg-green-600 text-white">
        <tr>
          <th className="py-3 px-4 text-left">#</th>
          <th className="py-3 px-4 text-left">Type</th>
          <th className="py-3 px-4 text-left">Model</th>
          <th className="py-3 px-4 text-left">Manufacture Year</th>
          <th className="py-3 px-4 text-left">Driver Phone</th>
          <th className="py-3 px-4 text-left">Mechanic Name</th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody className="divide-y divide-gray-200">
        {car.map((cars, index) => (
          <tr
            key={cars.plateNumber}
            className="hover:bg-gray-100 transition"
          >
            <td className="py-3 px-4">{index + 1}</td>
            <td className="py-3 px-4 font-medium">{cars.type}</td>
            <td className="py-3 px-4">{cars.model}</td>
            <td className="py-3 px-4">{cars.manufacture_year}</td>
            <td className="py-3 px-4 text-blue-600">{cars.driverPhone}</td>
            <td className="py-3 px-4">{cars.mechanicName}</td>
          </tr>
        ))}
      </tbody>

    </table>
  </div>
</div>
    )
}