import { useState } from "react";
import axios from "axios";

export default function Service() {
  const [service,setservice] = useState({
  	serviceName:"",
    servicePrice:""
  });

  const handleChange = (e) => {
    setservice({
      ...service,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/service",service,);
      alert("Data inserted successfully");

      setservice({
        serviceName:"",
    servicePrice:""
      });
    } catch (err) {
      console.log("Error inserting data:", err);
    }
  };

  return (
   <div className="container mt-5">
  <div className="card p-4 shadow col-md-5 mx-auto">
    <h4 className="text-center mb-3">Add Service</h4>

    <form onSubmit={handleSubmit}>
      
      {/* Service Name */}
      <div className="mb-3">
        <input
          type="text"
          name="serviceName"
          value={service.serviceName}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter service name"
          required
        />
      </div>

      {/* Service Price */}
      <div className="mb-3">
        <input
          type="number"
          name="servicePrice"
          value={service.servicePrice}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter service price"
          required
        />
      </div>

      {/* Button */}
      <div className="d-grid">
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </div>

    </form>
  </div>
</div>
  );
}