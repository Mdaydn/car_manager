import { useState, useEffect } from "react";
import axios from "axios";

export default function Payment(){
    const [serviceRecord,setserviceRecord]=useState([]);
    const [recordId,setrecordId]=useState("");
    const [amountPaid,setamountPaid]=useState("");
    const [paymentDate,setpaymentDate]=useState("");

    useEffect(()=>{
        axios.get("http://localhost:5000/serviceRecord")
        .then(res=>setserviceRecord(res.data))
    },[])

    const handleSubmit=(e)=>{
        e.preventDefault();
        try{
            axios.post("http://localhost:5000/payment",{
                recordId,
                amountPaid,
                paymentDate
            })
            alert("the new data is inserted on database")
            setrecordId("");
            setamountPaid("");
            setpaymentDate("");
            
        }
        catch(err){
            console.log("is new error", err)
        }
    }

    return(
<div className="container mt-5">
  <div className="card shadow p-4">
    <h3 className="text-center mb-4">Payment Form</h3>

    <form onSubmit={handleSubmit}>
      
      {/* Select */}
      <div className="mb-3">
        <label className="form-label">Record Number</label>
        <select
          className="form-select"
          value={recordId}
          onChange={(e) => setrecordId(e.target.value)}
        >
          <option value="">Select record number</option>
          {serviceRecord.map((r) => (
            <option key={r.recordId} value={r.recordId}>
              {r.recordId}
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div className="mb-3">
        <label className="form-label">Amount Paid</label>
        <input
          type="text"
          className="form-control"
          name="amountpaid"
          value={amountPaid}
          onChange={(e) => setamountPaid(e.target.value)}
          placeholder="Enter amount paid"
        />
      </div>

      {/* Date */}
      <div className="mb-3">
        <label className="form-label">Payment Date</label>
        <input
          type="date"
          className="form-control"
          name="paymentdate"
          value={paymentDate}
          onChange={(e) => setpaymentDate(e.target.value)}
        />
      </div>

      {/* Button */}
      <div className="d-grid">
        <button type="submit" className="btn btn-primary">
          Submit Payment
        </button>
      </div>

    </form>
  </div>
</div>

    )
}