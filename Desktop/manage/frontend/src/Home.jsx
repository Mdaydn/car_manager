import { Link } from "react-router-dom";

const quickActions = [
  { title: "Register a Car", path: "/car", description: "Add new car information quickly." },
  { title: "Add Service", path: "/service", description: "Create and update available services." },
  { title: "Record Payment", path: "/Payment", description: "Track amounts paid per service record." },
];

export default function Home() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
        <p className="text-sm uppercase tracking-wide text-indigo-100">Welcome</p>
        <h1 className="mt-1 text-3xl font-bold">Garage Operations Portal</h1>
        <p className="mt-2 max-w-2xl text-indigo-100">
          Use this app to manage your daily workshop flow from car intake to service and payments.
        </p>
        <Link
          to="/dashboard"
          className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          Open Dashboard
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <h3 className="text-base font-semibold text-slate-900">{action.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{action.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
