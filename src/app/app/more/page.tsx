import Link from "next/link";
import { FileText, WalletCards } from "lucide-react";
import { GlobalPlaceholder } from "@/features/navigation/global-placeholder";
export default function MorePage() { return <div><GlobalPlaceholder title="Více" description="Další globální nástroje Nomadia." /><div className="mt-4 flex gap-2"><Link href="/app/finance" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm"><WalletCards className="size-4" /> Finance</Link><Link href="/app/documents" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm"><FileText className="size-4" /> Dokumenty</Link></div></div>; }
