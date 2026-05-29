import { useState, useEffect } from "react";
import axios from "axios";

export default function ServiceRecord() {
    const[serviceCode,setserviceCode]=useState("");
    const[carId,setcarId]=useState("");
    const[serviceDate,setserviceDate]=useState("");
    const[service,setservice]=useState([]);
    const[car,setCar]=useState([]);
  

useEffect(()=>{
   
        axios.get("http://localhost:5000/service")
        .then(res=>{setservice(res.data)})
        axios.get("http://localhost:5000/car")
        .then(res=>{setCar(res.data)})   
   
},[])
const handleSubmit=(e)=>{
    e.preventDefault();
    try{
        axios.post("http://localhost:5000/serviceRecord",{
            serviceCode,carId,serviceDate
        })
        alert("data is inserted on database")
        setcarId("");
        setserviceCode("");
        setserviceDate("")
    }catch{console.log("new error" )}
}

  return (<div className="container mt-5">
  <div className="card p-4 shadow col-md-6 mx-auto">
    <h4 className="text-center mb-4">Service Record</h4>

    <form onSubmit={handleSubmit}>
      
      {/* Service Select */}
      <div className="mb-3">
        <label className="form-label">Select Service</label>
        <select
          className="form-select"
          value={serviceCode}
          onChange={(e) => setserviceCode(e.target.value)}
          required
        >
          <option value="">Select service</option>

          {service.map((s) => (
            <option
              key={s.serviceCode}
              value={s.serviceCode}   // ✅ IMPORTANT FIX
            >
              {s.serviceCode} : {s.serviceName}
            </option>
          ))}
        </select>
      </div>

      {/* Car Select */}
      <div className="mb-3">
        <label className="form-label">Select Car</label>
        <select
          className="form-select"
          value={carId}
          onChange={(e) => setcarId(e.target.value)}
          required
        >
          <option value="">Select car</option>

          {car.map((c) => (
            <option
              key={c.id}
              value={c.id}
            >
              {c.id} : {c.type}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div className="mb-3">
        <label className="form-label">Service Date</label>
        <input
          type="date"
          className="form-control"
          name="date"
          value={serviceDate}
          onChange={(e) => setserviceDate(e.target.value)}
          required
        />
      </div>

      {/* Button */}
      <div className="d-grid">
        <button type="submit" className="btn btn-primary">
          Save Record
        </button>
      </div>

    </form>
  </div>
</div>
  );
}