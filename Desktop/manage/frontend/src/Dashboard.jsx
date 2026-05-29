import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value ?? "-"}</p>
    </div>
  );
}

export default function Dashboard() {
  const [carCount, setCarCount] = useState(null);
  const [serviceCount, setServiceCount] = useState(null);
  const [recordCount, setRecordCount] = useState(null);

  const tokenUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // Dashboard is best-effort; if backend is down, keep UI usable.
    const fetchCounts = async () => {
      try {
        const [carRes, serviceRes, recordRes] = await Promise.all([
          axios.get("http://localhost:5000/car"),
          axios.get("http://localhost:5000/service"),
          axios.get("http://localhost:5000/serviceRecord"),
        ]);

        setCarCount(Array.isArray(carRes.data) ? carRes.data.length : 0);
        setServiceCount(Array.isArray(serviceRes.data) ? serviceRes.data.length : 0);
        setRecordCount(Array.isArray(recordRes.data) ? recordRes.data.length : 0);
      } catch {
        setCarCount(null);
        setServiceCount(null);
        setRecordCount(null);
      }
    };

    fetchCounts();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Overview</p>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        </div>
        <div className="text-sm text-slate-600">
          {tokenUser?.name ? (
            <span>
              Signed in as <span className="font-semibold">{tokenUser.name}</span>
            </span>
          ) : (
            <span>Sign in to personalize</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Cars" value={carCount} />
        <StatCard label="Services" value={serviceCount} />
        <StatCard label="Service Records" value={recordCount} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Quick Links</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { to: "/car", label: "Add Car" },
            { to: "/service", label: "Add Service" },
            { to: "/ServiceRecord", label: "Create Record" },
            { to: "/Payment", label: "Payment" },
            { to: "/Carreport", label: "Car Report" },
            { to: "/surviceReport", label: "Service Report" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

