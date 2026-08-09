import { redirect } from "next/navigation";
import { CalendarDashboard } from "@/features/calendar/calendar-dashboard";
import { getGlobalCalendarData } from "@/features/calendar/calendar-data";
import { getAuthenticatedProfile } from "@/features/auth/session";

type CalendarPageProps = { searchParams: Promise<{ month?: string; view?: string }> };

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const [auth, params] = await Promise.all([getAuthenticatedProfile(), searchParams]);
  if (!auth) redirect("/login?next=/app/calendar");
  const initialView = params.view === "agenda" ? "agenda" : "month";
  const data = await getGlobalCalendarData();
  const initialMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? "") ? params.month : undefined;
  return <div><header className="border-b border-border pb-6"><p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">Nomadio</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Kalendář</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Cesty a důležité termíny na jednom místě.</p></header>{data.loadWarnings.map((message) => <p key={message} role="status" className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-sm text-amber-100">{message}</p>)}<CalendarDashboard agenda={data.agenda} initialView={initialView} monthEvents={data.monthEvents} trips={data.trips} {...(initialMonth ? { initialMonth } : {})} /></div>;
}
