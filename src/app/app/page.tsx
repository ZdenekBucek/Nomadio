import { getGlobalOverviewData } from "@/features/global-overview/global-overview-data";
import { GlobalOverviewDashboard } from "@/features/global-overview/global-overview-dashboard";

export default async function AppPage() {
  const { data, loadWarnings } = await getGlobalOverviewData();
  return <div>{loadWarnings.map((warning) => <p key={warning} role="status" className="rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-sm text-amber-100">{warning}</p>)}<GlobalOverviewDashboard data={data} /></div>;
}
