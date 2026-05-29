import Carreport from "../../carReport";
import SurviceReport from "../../serviceReport";

export default function AllReports() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">Admin report</p>
        <h2 className="text-2xl font-bold text-slate-900">All Reports</h2>
        <p className="mt-1 text-sm text-slate-600">Full car and service listings.</p>
      </div>
      <div>
        <h3 className="mb-3 text-lg font-semibold">Car report</h3>
        <Carreport />
      </div>
      <div>
        <h3 className="mb-3 text-lg font-semibold">Service report</h3>
        <SurviceReport />
      </div>
    </section>
  );
}
