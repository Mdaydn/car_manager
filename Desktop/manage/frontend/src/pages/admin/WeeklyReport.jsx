import { useEffect, useState } from "react";
import axios from "axios";

function isThisWeek(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

export default function WeeklyReport() {
  const [records, setRecords] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:5000/serviceRecord"),
      axios.get("http://localhost:5000/payment"),
    ]).then(([recRes, payRes]) => {
      setRecords((recRes.data || []).filter((r) => isThisWeek(r.serviceDate)));
      setPayments((payRes.data || []).filter((p) => isThisWeek(p.paymentDate)));
    });
  }, []);

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Admin report</p>
        <h2 className="text-2xl font-bold text-slate-900">Weekly Report</h2>
        <p className="mt-1 text-sm text-slate-600">Activity for the current week.</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <SimpleList title="Weekly service records" items={records.map((r) => `Record #${r.recordId} — ${r.serviceDate}`)} />
        <SimpleList title="Weekly payments" items={payments.map((p) => `#${p.paymentId} — ${p.amountPaid} (${p.paymentDate})`)} />
      </div>
    </section>
  );
}

function SimpleList({ title, items }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {items.length === 0 ? (
          <li className="text-slate-500">No data this week.</li>
        ) : (
          items.map((item, i) => (
            <li key={i} className="rounded-lg bg-slate-50 px-3 py-2">
              {item}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
