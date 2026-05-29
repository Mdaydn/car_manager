import { useState } from "react";
import axios from "axios";

export default function Car() {
  const [car, setCar] = useState({
    type: "",
    model: "",
    manufacture_year: "",
    driverPhone: "",
    mechanicName: ""
  });

  const handleChange = (e) => {
    setCar({
      ...car,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/car", car);
      alert("Data inserted successfully");

      setCar({
        type: "",
        model: "",
        manufacture_year: "",
        driverPhone: "",
        mechanicName: ""
      });
    } catch (err) {
      console.log("Error inserting data:", err);
    }
  };

  return (
<div className="container mt-5">
  <div className="card shadow p-4 col-md-6 mx-auto">
    <h4 className="text-center mb-4">Car Registration</h4>

    <form onSubmit={handleSubmit}>

      {/* Type */}
      <div className="mb-3">
        <label className="form-label">Car Type</label>
        <input
          type="text"
          name="type"
          value={car.type}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter car type"
          required
        />
      </div>

      {/* Model */}
      <div className="mb-3">
        <label className="form-label">Model</label>
        <input
          type="text"
          name="model"
          value={car.model}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter model"
          required
        />
      </div>

      {/* Manufacture Year */}
      <div className="mb-3">
        <label className="form-label">Manufacture Year</label>
        <input
          type="number"
          name="manufacture_year"
          value={car.manufacture_year}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter year"
          required
        />
      </div>

      {/* Driver Phone */}
      <div className="mb-3">
        <label className="form-label">Driver Phone</label>
        <input
          type="number"
          name="driverPhone"
          value={car.driverPhone}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter phone number"
          required
        />
      </div>

      {/* Mechanic Name */}
      <div className="mb-3">
        <label className="form-label">Mechanic Name</label>
        <input
          type="text"
          name="mechanicName"
          value={car.mechanicName}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter mechanic name"
          required
        />
      </div>

      {/* Button */}
      <div className="d-grid">
        <button type="submit" className="btn btn-success">
          Save Car
        </button>
      </div>

    </form>
  </div>
</div>
  );
}