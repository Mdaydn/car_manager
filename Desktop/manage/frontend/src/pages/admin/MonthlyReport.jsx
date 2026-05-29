import { useEffect, useState } from "react";
import axios from "axios";

function isThisMonth(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function MonthlyReport() {
  const [records, setRecords] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:5000/serviceRecord"),
      axios.get("http://localhost:5000/payment"),
    ]).then(([recRes, payRes]) => {
      setRecords((recRes.data || []).filter((r) => isThisMonth(r.serviceDate)));
      setPayments((payRes.data || []).filter((p) => isThisMonth(p.paymentDate)));
    });
  }, []);

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Admin report</p>
        <h2 className="text-2xl font-bold text-slate-900">Monthly Report</h2>
        <p className="mt-1 text-sm text-slate-600">Service records and payments for the current month.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Service records</p>
          <p className="text-2xl font-bold">{records.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Payments</p>
          <p className="text-2xl font-bold">{payments.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Total collected</p>
          <p className="text-2xl font-bold text-emerald-700">{totalPaid}</p>
        </div>
      </div>

      <ReportTable
        title="Monthly service records"
        headers={["Record ID", "Car ID", "Service code", "Date"]}
        rows={records.map((r) => [r.recordId, r.carId, r.serviceCode, r.serviceDate])}
      />
      <ReportTable
        title="Monthly payments"
        headers={["Payment ID", "Record ID", "Amount", "Date"]}
        rows={payments.map((p) => [p.paymentId, p.recordId, p.amountPaid, p.paymentDate])}
      />
    </section>
  );
}

function ReportTable({ title, headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <h3 className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">{title}</h3>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-indigo-600 text-white">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-6 text-center text-slate-500">
                No data for this month.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
