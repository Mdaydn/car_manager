import { useEffect, useState } from "react";
import axios from "axios";

export default function Invoice() {
  const [payments, setPayments] = useState([]);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:5000/payment"),
      axios.get("http://localhost:5000/serviceRecord"),
    ]).then(([payRes, recRes]) => {
      setPayments(payRes.data || []);
      setRecords(recRes.data || []);
    });
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Admin</p>
          <h2 className="text-2xl font-bold text-slate-900">Invoices</h2>
          <p className="mt-1 text-sm text-slate-600">Payment invoices from the database.</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 print:hidden"
        >
          Print invoices
        </button>
      </div>

      <div className="space-y-4">
        {payments.length === 0 ? (
          <p className="text-slate-500">No payments found.</p>
        ) : (
          payments.map((p) => {
            const record = records.find((r) => String(r.recordId) === String(p.recordId));
            return (
              <article
                key={p.paymentId}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:break-inside-avoid"
              >
                <div className="flex justify-between border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Garage Management</p>
                    <h3 className="text-lg font-bold">Invoice #{p.paymentId}</h3>
                  </div>
                  <p className="text-sm text-slate-600">{p.paymentDate}</p>
                </div>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-slate-500">Record ID:</span> {p.recordId}
                  </p>
                  <p>
                    <span className="text-slate-500">Service date:</span> {record?.serviceDate || "—"}
                  </p>
                  <p>
                    <span className="text-slate-500">Car ID:</span> {record?.carId || "—"}
                  </p>
                  <p>
                    <span className="text-slate-500">Service code:</span> {record?.serviceCode || "—"}
                  </p>
                </div>
                <p className="mt-4 text-xl font-bold text-emerald-700">Amount paid: {p.amountPaid}</p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
