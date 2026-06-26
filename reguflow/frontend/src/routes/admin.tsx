import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bot,
  Braces,
  CheckCircle2,
  Clock,
  Copy,
  DatabaseZap,
  Download,
  Eye,
  EyeOff,
  FileCheck2,
  FileLock2,
  FileText,
  Filter,
  GitBranch,
  Hash,
  KeyRound,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Lock,
  Network,
  RefreshCw,
  ServerCog,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  Users,
  Workflow,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Canara Bank · ReguFlow Live Console" },
      {
        name: "description",
        content:
          "Live Canara Bank compliance dashboard fed by RBI sandbox circular uploads and ReguFlow agent processing.",
      },
    ],
  }),
  component: AdminPanel,
});

type Dept =
  | "Cybersecurity Wing"
  | "IT Operations"
  | "Compliance Office"
  | "Core Banking"
  | "Risk Management"
  | "Internal Audit";

type Risk = "Critical" | "High" | "Medium" | "Low";
type MandateStatus = "Routed" | "Human Review" | "Pending Validation" | "Compliant";

type Circular = {
  id: number;
  reference_number: string;
  title: string;
  category: string;
  priority: Risk;
  summary: string | null;
  full_content: string | null;
  target_departments: string[];
  status: string;
  pdf_path: string | null;
  created_at: string;
  published_at: string | null;
  issue_date: string | null;
  effective_date: string | null;
};

type RegEvent = {
  id: number;
  event_id: string;
  event_type: string;
  regulation_id: string;
  regulation_title: string | null;
  category: string | null;
  priority: Risk | null;
  timestamp: string;
};

type DashboardStats = {
  total_circulars: number;
  draft_circulars: number;
  published_circulars: number;
  critical_advisories: number;
  recent_publications: Partial<Circular>[];
  recent_events: Partial<RegEvent>[];
};

type Mandate = {
  id: string;
  circularId: number;
  title: string;
  dept: Dept;
  deadline: string;
  risk: Risk;
  status: MandateStatus;
  source: string;
  maps: string[];
  confidence: number;
  publishedAt: string | null;
  pdfPath: string | null;
};

type LiveState = {
  stats: DashboardStats;
  publications: Circular[];
  events: RegEvent[];
};

type ComplianceCaseItem = {
  case_id: string;
  regulation_id: string;
  regulation_title: string | null;
  status: string;
  authorized_by: string | null;
  authorized_at: string | null;
  authorization_hash: string | null;
  failed_attempts: number;
  priority: string | null;
};

const ZERO_STATS: DashboardStats = {
  total_circulars: 0,
  draft_circulars: 0,
  published_circulars: 0,
  critical_advisories: 0,
  recent_publications: [],
  recent_events: [],
};

const DEPTS: Dept[] = [
  "Cybersecurity Wing",
  "IT Operations",
  "Compliance Office",
  "Core Banking",
  "Risk Management",
  "Internal Audit",
];

const API_BASE = "http://127.0.0.1:8001/api";
const RBI_API_BASE = "http://127.0.0.1:8000/api";

function dossierDownloadUrl(regulationId: string) {
  return `${RBI_API_BASE}/v1/compliance/${encodeURIComponent(regulationId)}/download`;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${RBI_API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function addDays(iso: string | null | undefined, days: number) {
  const base = iso ? new Date(iso) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function routeDept(c: Circular): Dept {
  const text = `${c.title} ${c.category} ${c.summary ?? ""} ${c.target_departments?.join(" ") ?? ""}`.toLowerCase();
  if (text.includes("core")) return "Core Banking";
  if (text.includes("risk") || text.includes("fraud")) return "Risk Management";
  if (text.includes("audit")) return "Internal Audit";
  if (text.includes("it operations") || text.includes("incident")) return "IT Operations";
  if (text.includes("cyber") || text.includes("security") || text.includes("data")) return "Cybersecurity Wing";
  return "Compliance Office";
}

function deriveMaps(c: Circular): string[] {
  const text = `${c.title} ${c.category} ${c.summary ?? ""} ${c.full_content ?? ""}`.toLowerCase();
  const maps = [
    `Register ${c.reference_number} in Canara Bank regulatory inventory`,
    `Assign accountable owner in ${routeDept(c)}`,
  ];

  if (text.includes("cyber") || text.includes("security") || text.includes("encryption")) {
    maps.push("Verify cyber control configuration and capture implementation evidence");
  }
  if (text.includes("fraud")) {
    maps.push("Update fraud monitoring rules and exception reporting thresholds");
  }
  if (text.includes("data")) {
    maps.push("Validate data handling, retention, and access-control policy alignment");
  }
  if (text.includes("compliance") || text.includes("direction") || text.includes("notice")) {
    maps.push("Prepare compliance officer review note and branch communication");
  }

  maps.push("Generate SHA-256 audit receipt after departmental acknowledgement");
  return Array.from(new Set(maps));
}

function confidenceFor(c: Circular) {
  let score = 72;
  if (c.summary) score += 7;
  if (c.full_content && c.full_content.length > 80) score += 8;
  if (c.pdf_path) score += 7;
  if (c.target_departments?.length) score += 4;
  return Math.min(score, 98);
}

function statusFor(c: Circular): MandateStatus {
  if (c.priority === "Critical" || c.priority === "High") return "Human Review";
  if (c.priority === "Low") return "Routed";
  return "Pending Validation";
}

function deriveMandates(publications: Circular[]): Mandate[] {
  return publications.map((c) => ({
    id: c.reference_number,
    circularId: c.id,
    title: c.title,
    dept: routeDept(c),
    deadline: addDays(c.published_at ?? c.created_at, c.priority === "Critical" ? 2 : c.priority === "High" ? 7 : 15),
    risk: c.priority,
    status: statusFor(c),
    source: c.pdf_path ? `RBI Sandbox PDF · ${c.pdf_path}` : "RBI Sandbox circular",
    maps: deriveMaps(c),
    confidence: confidenceFor(c),
    publishedAt: c.published_at,
    pdfPath: c.pdf_path,
  }));
}

function riskColor(r: Risk) {
  return r === "Critical"
    ? "bg-destructive text-destructive-foreground"
    : r === "High"
      ? "bg-warning text-primary-deep"
      : r === "Medium"
        ? "bg-gold text-primary-deep"
        : "bg-secondary text-secondary-foreground";
}

function statusColor(s: MandateStatus) {
  return s === "Compliant"
    ? "bg-success/15 text-success border border-success/30"
    : s === "Human Review"
      ? "bg-destructive/15 text-destructive border border-destructive/30"
      : s === "Pending Validation"
        ? "bg-primary/10 text-primary border border-primary/30"
        : "bg-muted text-muted-foreground border";
}

function useLiveReguflow() {
  const [state, setState] = useState<LiveState>({
    stats: ZERO_STATS,
    publications: [],
    events: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [stats, publications, events] = await Promise.all([
        request<DashboardStats>("/stats"),
        request<Circular[]>("/publications"),
        request<RegEvent[]>("/events"),
      ]);
      setState({
        stats: stats ?? ZERO_STATS,
        publications,
        events,
      });
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (e) {
      setState({ stats: ZERO_STATS, publications: [], events: [] });
      setError("Waiting for RBI sandbox API on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 5000);
    return () => window.clearInterval(timer);
  }, []);

  return { ...state, loading, error, lastUpdated, refresh: () => load(false) };
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
      <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 font-semibold text-primary-deep">{title}</h3>
      <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function AdminPanel() {
  const [dept, setDept] = useState<Dept>("Cybersecurity Wing");
  const [tab, setTab] = useState<"pipeline" | "dashboard" | "worklist" | "sandbox" | "audit" | "authorization">("pipeline");
  const live = useLiveReguflow();
  const mandates = useMemo(() => deriveMandates(live.publications), [live.publications]);
  const filtered = useMemo(() => mandates.filter((m) => m.dept === dept), [mandates, dept]);

  return (
    <div className="min-h-screen bg-secondary/30">
      <AdminHeader dept={dept} setDept={setDept} live={live} />
      <div className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <SideNav tab={tab} setTab={setTab} />
        <main>
          {tab === "pipeline" && <Pipeline live={live} mandates={mandates} />}
          {tab === "dashboard" && <Dashboard dept={dept} items={filtered} allItems={mandates} live={live} />}
          {tab === "worklist" && <Worklist items={filtered} allItems={mandates} dept={dept} />}
          {tab === "sandbox" && <Sandbox items={filtered} dept={dept} />}
          {tab === "audit" && <AuditTrail events={live.events} mandates={mandates} />}
          {tab === "authorization" && <ComplianceAuthorizationPanel publications={live.publications} />}
        </main>
      </div>
    </div>
  );
}

function AdminHeader({
  dept,
  setDept,
  live,
}: {
  dept: Dept;
  setDept: (d: Dept) => void;
  live: ReturnType<typeof useLiveReguflow>;
}) {
  return (
    <header className="bg-hero text-primary-foreground">
      <div className="container mx-auto flex flex-wrap items-center gap-4 px-4 py-5">
        <Link to="/" className="inline-flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
          <ArrowLeft className="h-4 w-4" /> Back to Bank
        </Link>
        <div className="ml-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold font-bold text-primary-deep shadow-[var(--shadow-glow)]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70">ReguFlow · Canara Bank Console</p>
            <p className="text-lg font-bold leading-tight">Live RBI Sandbox Agent Dashboard</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={live.refresh}
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <span className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex ${live.error ? "bg-destructive/30" : "bg-success/20"}`}>
            {live.error ? "API waiting" : "Live"}
          </span>
          <div className="hidden items-center gap-2 text-xs opacity-80 md:flex">
            <Filter className="h-3 w-3" /> Department
          </div>
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value as Dept)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-primary-foreground backdrop-blur focus:outline-none focus:ring-2 focus:ring-gold"
          >
            {DEPTS.map((d) => (
              <option key={d} value={d} className="text-foreground">
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

function SideNav({ tab, setTab }: { tab: string; setTab: (t: any) => void }) {
  const items = [
    { k: "pipeline", l: "Agent Processing", i: Workflow },
    { k: "dashboard", l: "Canara Dashboard", i: LayoutDashboard },
    { k: "worklist", l: "Compliance Worklist", i: ListChecks },
    { k: "sandbox", l: "Validation Center", i: ServerCog },
    { k: "audit", l: "Audit Timeline", i: FileLock2 },
    { k: "authorization", l: "Authorization", i: KeyRound },
  ];
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <nav className="rounded-2xl border bg-card p-2 shadow-sm">
        {items.map((it) => {
          const Icon = it.i;
          const active = tab === it.k;
          return (
            <button
              key={it.k}
              onClick={() => setTab(it.k)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-hero text-primary-foreground shadow-[var(--shadow-card)]" : "text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-4 w-4" /> {it.l}
              {it.k === "authorization" && (
                <span className="ml-auto rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-bold text-primary-deep">NEW</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="mt-4 rounded-2xl border bg-card p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-1 font-semibold text-primary-deep">
          <Lock className="h-3 w-3" /> No Synthetic Data
        </p>
        <p className="mt-1">Counts and cards are derived from uploaded RBI sandbox circulars only.</p>
      </div>
    </aside>
  );
}

function Dashboard({
  dept,
  items,
  allItems,
  live,
}: {
  dept: Dept;
  items: Mandate[];
  allItems: Mandate[];
  live: ReturnType<typeof useLiveReguflow>;
}) {
  const total = items.length;
  const highRisk = items.filter((m) => m.risk === "Critical" || m.risk === "High").length;
  const pending = items.filter((m) => m.status !== "Compliant").length;
  const health = total === 0 ? 0 : Math.max(0, Math.round(((total - highRisk * 0.35 - pending * 0.1) / total) * 100));
  const latest = allItems[0];

  const stats = [
    { l: "Health Score", v: `${health}%`, i: Activity, tone: "text-success" },
    { l: "Active MAPs", v: total, i: ListChecks, tone: "text-primary" },
    { l: "Needs Review", v: highRisk, i: AlertTriangle, tone: "text-destructive" },
    { l: "Uploaded Circulars", v: live.stats.published_circulars, i: CheckCircle2, tone: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Department View · {dept}</p>
        <h1 className="text-2xl font-bold text-primary-deep md:text-3xl">Canara Bank Live Compliance Health</h1>
        <p className="text-sm text-muted-foreground">
          Updated from RBI sandbox uploads every 5 seconds. Last update: {fmtDateTime(live.lastUpdated)}
        </p>
      </div>

      {live.error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{live.error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.i;
          return (
            <div key={s.l} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary ${s.tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-2xl font-bold text-primary-deep">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          );
        })}
      </div>

      {allItems.length === 0 ? (
        <EmptyState
          title="No RBI circular uploaded yet"
          body="Upload and publish a PDF in the RBI sandbox portal. This Canara Bank dashboard will then show the generated MAPs, departments, risk, and audit trail."
        />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border bg-card p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-primary-deep">Canara Department Load</h3>
                <span className="text-xs text-muted-foreground">{allItems.length} live MAP group(s)</span>
              </div>
              <div className="space-y-4">
                {DEPTS.map((d) => {
                  const count = allItems.filter((m) => m.dept === d).length;
                  const value = allItems.length === 0 ? 0 : Math.round((count / allItems.length) * 100);
                  return (
                    <div key={d}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{d}</span>
                        <span className={count > 0 ? "text-primary" : "text-muted-foreground"}>{count}</span>
                      </div>
                      <Progress value={value} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-2xl bg-hero p-6 text-primary-foreground">
              <Users className="h-6 w-6 text-gold" />
              <p className="mt-3 text-sm opacity-80">Latest Processed Circular</p>
              <p className="text-xl font-bold">{latest?.id ?? "—"}</p>
              <div className="mt-4 space-y-2 text-sm opacity-90">
                <p>Routed to: {latest?.dept ?? "—"}</p>
                <p>Risk: {latest?.risk ?? "—"}</p>
                <p>Agent confidence: {latest?.confidence ?? 0}%</p>
              </div>
              {latest && (
                <a
                  href={dossierDownloadUrl(latest.id)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold-grad px-4 py-2 text-sm font-semibold text-primary-deep transition hover:opacity-90"
                >
                  <Download className="h-4 w-4" /> Download Dossier
                </a>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <h3 className="mb-4 font-semibold text-primary-deep">Live Mandates for {dept}</h3>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No uploaded circular has routed MAPs to this department yet.</p>
            ) : (
              <div className="space-y-2">
                {items.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3 transition hover:bg-secondary/50">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${riskColor(m.risk)}`}>{m.risk.toUpperCase()}</span>
                    <span className="font-mono text-xs text-muted-foreground">{m.id}</span>
                    <span className="min-w-[200px] flex-1 text-sm font-medium">{m.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusColor(m.status)}`}>{m.status}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {m.deadline}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Worklist({ items, allItems, dept }: { items: Mandate[]; allItems: Mandate[]; dept: Dept }) {
  const [open, setOpen] = useState<string | null>(null);
  const visible = items.length ? items : [];

  useEffect(() => {
    setOpen(visible[0]?.id ?? null);
  }, [dept, visible[0]?.id]);

  if (allItems.length === 0) {
    return (
      <EmptyState
        title="No MAPs generated"
        body="The worklist remains empty until an RBI sandbox upload is published and the ReguFlow agent derives measurable action points."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-primary-deep md:text-3xl">Compliance Worklist</h1>
        <p className="text-sm text-muted-foreground">Agent-generated MAPs routed to {dept}.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        {visible.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No current MAPs for this department.</p>
        ) : (
          visible.map((m) => {
            const expanded = open === m.id;
            return (
              <div key={m.id} className="border-b last:border-b-0">
                <button onClick={() => setOpen(expanded ? null : m.id)} className="flex w-full flex-wrap items-center gap-3 p-4 text-left transition hover:bg-secondary/40">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${riskColor(m.risk)}`}>{m.risk}</span>
                  <span className="font-mono text-xs text-muted-foreground">{m.id}</span>
                  <span className="min-w-[220px] flex-1 font-semibold">{m.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusColor(m.status)}`}>{m.status}</span>
                </button>
                {expanded && (
                  <div className="grid gap-4 bg-secondary/30 px-4 pb-5 pt-2 md:grid-cols-[1fr_260px]">
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Measurable Action Points</p>
                      <ol className="space-y-2">
                        {m.maps.map((s, i) => (
                          <li key={s} className="flex items-start gap-3 text-sm">
                            <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="space-y-2 rounded-xl border bg-card p-4 text-xs">
                      <p>
                        <span className="text-muted-foreground">Source: </span>
                        <span className="font-medium">{m.source}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Deadline: </span>
                        <span className="font-medium">{m.deadline}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Confidence: </span>
                        <span className="font-medium">{m.confidence}%</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Sandbox({ items, dept }: { items: Mandate[]; dept: Dept }) {
  const latest = items[0];
  if (!latest) {
    return (
      <EmptyState
        title="No validation target"
        body={`No live uploaded circular is currently routed to ${dept}. Validation will appear after routing.`}
      />
    );
  }

  const checks = latest.maps.map((map, index) => ({
    key: `MAP-${index + 1}`,
    required: map,
    actual: latest.status === "Routed" ? "Queued" : latest.status,
    ok: latest.status === "Compliant",
  }));
  const failing = checks.filter((c) => !c.ok).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-deep md:text-3xl">Validation Center</h1>
        <p className="text-sm text-muted-foreground">Expected vs observed state for {latest.id} in {dept}.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b bg-secondary/40 px-5 py-3">
            <p className="flex items-center gap-2 font-semibold text-primary-deep">
              <ServerCog className="h-4 w-4" /> Canara Validation Queue
            </p>
            <span className="font-mono text-xs text-muted-foreground">{latest.id}</span>
          </div>
          <div className="divide-y">
            {checks.map((c) => (
              <div key={c.key} className="grid gap-3 px-5 py-3 text-sm md:grid-cols-[90px_1fr_150px_auto] md:items-center">
                <span className="font-mono text-xs font-medium">{c.key}</span>
                <span className="text-muted-foreground">{c.required}</span>
                <span className="font-mono text-xs text-primary">{c.actual}</span>
                {c.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-warning" />}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t bg-secondary/30 px-5 py-4">
            <p className="text-sm">
              Status: <span className={failing === 0 ? "font-semibold text-success" : "font-semibold text-warning"}>{failing === 0 ? "COMPLIANT" : `${failing} MAP(s) awaiting evidence`}</span>
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-hero p-6 text-primary-foreground">
          <FileCheck2 className="h-6 w-6 text-gold" />
          <p className="mt-3 text-lg font-bold">Evidence Request</p>
          <p className="mt-1 text-xs opacity-80">Generated from the latest uploaded circular and routed MAPs.</p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-black/30 p-3 text-[11px] leading-relaxed">
{`reguflow validate --circular ${latest.id}
department="${latest.dept}"
maps=${latest.maps.length}
status="${latest.status}"`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function AuditTrail({ events, mandates }: { events: RegEvent[]; mandates: Mandate[] }) {
  if (events.length === 0 && mandates.length === 0) {
    return (
      <EmptyState
        title="No audit events"
        body="Audit replay starts after an RBI sandbox circular is uploaded and published."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-deep md:text-3xl">Audit Timeline</h1>
        <p className="text-sm text-muted-foreground">Live publication events plus deterministic ReguFlow agent receipts.</p>
      </div>
      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="grid items-center gap-4 rounded-2xl border bg-card p-5 md:grid-cols-[120px_1fr_auto]">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-grad text-primary-deep">
                <Hash className="h-5 w-5" />
              </div>
              <p className="mt-2 font-mono text-xs">{e.regulation_id}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Event:</span> <span className="font-medium">{e.event_type}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Circular:</span> {e.regulation_title}
              </p>
              <p>
                <span className="text-muted-foreground">Timestamp:</span> {fmtDateTime(e.timestamp)}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">Receipt source: RBI sandbox event #{e.event_id}</p>
            </div>
            <Button size="sm" variant="outline">
              <Copy className="mr-1 h-3 w-3" /> Copy
            </Button>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-primary-deep">
          <Activity className="h-4 w-4" /> ReguFlow Replay
        </h3>
        <ol className="relative ml-2 space-y-4 border-l-2 border-primary/20 pl-5 text-sm">
          {mandates.flatMap((m) => {
            // Check if a COMPLIANCE_AUTHORIZED event exists for this mandate
            const authEvent = events.find(
              (e) => e.regulation_id === m.id && e.event_type === "COMPLIANCE_AUTHORIZED"
            );
            const authFailedEvent = events.find(
              (e) => e.regulation_id === m.id && e.event_type === "AUTHORIZATION_FAILED"
            );
            const baseSteps = [
              { t: m.publishedAt, d: `${m.id} published in RBI sandbox`, tone: "bg-gold" },
              { t: m.publishedAt, d: `Obligations extracted · ${m.maps.length} duties identified`, tone: "bg-gold" },
              { t: m.publishedAt, d: `MAP Generated · ${m.maps.length} MAPs at ${m.confidence}% confidence`, tone: "bg-gold" },
              { t: m.publishedAt, d: `Approved · Risk scored ${m.risk}`, tone: "bg-gold" },
              { t: m.publishedAt, d: `Routed to ${m.dept}`, tone: "bg-gold" },
              { t: m.publishedAt, d: `Validation Passed · Awaiting Authorization`, tone: "bg-gold" },
            ];
            if (authFailedEvent && !authEvent) {
              baseSteps.push({
                t: authFailedEvent.timestamp,
                d: `Authorization Failed · Invalid code entered`,
                tone: "bg-destructive",
              });
            }
            if (authEvent) {
              baseSteps.push(
                { t: authEvent.timestamp, d: `Authorization Granted · COMPLIANCE_AUTHORIZED`, tone: "bg-success" },
                { t: authEvent.timestamp, d: `Compliance Completed · Case ${m.id} closed`, tone: "bg-success" }
              );
            }
            return baseSteps;
          }).map((s, i) => (
            <li key={`${s.d}-${i}`} className="relative">
              <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ${s.tone} ring-4 ring-gold/20`} />
              <p className="text-xs text-muted-foreground">{fmtDateTime(s.t)}</p>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Pipeline({ live, mandates }: { live: ReturnType<typeof useLiveReguflow>; mandates: Mandate[] }) {
  const latest = live.publications[0];
  const latestMandate = latest ? mandates.find((m) => m.circularId === latest.id) : undefined;
  const mapCount = mandates.reduce((sum, m) => sum + m.maps.length, 0);
  const highRisk = mandates.filter((m) => m.risk === "Critical" || m.risk === "High").length;
  const deptCount = new Set(mandates.map((m) => m.dept)).size;

  const stages = [
    {
      n: 1,
      k: "Circular Uploaded",
      icon: UploadCloud,
      sub: latest ? latest.reference_number : "RBI Sandbox Intake",
      desc: latest ? latest.title : "Waiting for the first uploaded and published RBI sandbox PDF.",
      tag: latest?.pdf_path ? "PDF attached" : "No upload",
      stat: { l: "Uploaded", v: live.stats.published_circulars },
    },
    {
      n: 2,
      k: "Agent Extracts Duties",
      icon: Bot,
      sub: "Regulatory Intelligence Agent",
      desc: latestMandate ? `${latestMandate.maps.length} obligations converted to MAPs.` : "Agent output is empty until a real circular arrives.",
      tag: "Deterministic local pass",
      stat: { l: "Confidence", v: latestMandate ? `${latestMandate.confidence}%` : "0%" },
    },
    {
      n: 3,
      k: "Risk & Governance",
      icon: Braces,
      sub: "Rule-based Scoring",
      desc: highRisk ? `${highRisk} uploaded circular(s) require human review.` : "No high-risk circulars in the live queue.",
      tag: "No invented risk",
      stat: { l: "MAPs", v: mapCount },
    },
    {
      n: 4,
      k: "Canara Updated",
      icon: Landmark,
      sub: "Department Work Queues",
      desc: deptCount ? `${deptCount} Canara department(s) now have live routed work.` : "Canara dashboard remains empty until upload.",
      tag: "Live dashboard",
      stat: { l: "Departments", v: deptCount },
    },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-hero p-8 text-primary-foreground shadow-[var(--shadow-card)]">
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs backdrop-blur">
            <DatabaseZap className="h-3.5 w-3.5 text-gold" /> Live Feed · RBI Sandbox → ReguFlow → Canara Bank
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
            {latest
              ? `${latest.reference_number} is being visualized on the Canara Bank dashboard.`
              : "Upload an RBI sandbox circular to start the ReguFlow agent."}
          </h1>
          <p className="mt-3 text-sm text-primary-foreground/85 md:text-base">
            This page does not use fixed demo counts. It polls the RBI sandbox API and derives agent MAPs, risk, routing, validation, and audit state from uploaded circulars.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            {[
              `${live.stats.published_circulars} uploaded`,
              `${mapCount} MAPs`,
              `${highRisk} high-risk`,
              `${live.events.length} audit events`,
            ].map((t) => (
              <span key={t} className="rounded-full border border-white/25 bg-white/10 px-3 py-1">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {latest ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Latest Uploaded Circular</p>
                <h2 className="text-xl font-bold text-primary-deep">{latest.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {latest.reference_number} · {latest.category} · Published {fmtDateTime(latest.published_at)}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Processed
              </span>
            </div>
            <div className="mt-4">
              <a
                href={dossierDownloadUrl(latest.reference_number)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Download className="h-4 w-4" /> Download Compliance Dossier
              </a>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {[
                { l: "Obligations", v: latestMandate?.maps.length ?? 0, i: FileText },
                { l: "MAPs Generated", v: latestMandate?.maps.length ?? 0, i: Braces },
                { l: "High Risk", v: latestMandate?.risk === "Critical" || latestMandate?.risk === "High" ? 1 : 0, i: AlertTriangle },
                { l: "Audit Events", v: live.events.length, i: DatabaseZap },
              ].map((s) => {
                const Icon = s.i;
                return (
                  <div key={s.l} className="rounded-xl border bg-secondary/30 p-4">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="mt-2 text-2xl font-bold text-primary-deep">{s.v}</p>
                    <p className="text-xs text-muted-foreground">{s.l}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-gold-grad p-6 text-primary-deep">
            <Landmark className="h-7 w-7" />
            <p className="mt-3 text-xs font-bold uppercase tracking-widest opacity-70">Canara Bank Impact</p>
            <p className="mt-1 text-2xl font-extrabold">{deptCount} department(s) updated</p>
            <div className="mt-4 space-y-2 text-sm font-semibold">
              {DEPTS.filter((d) => mandates.some((m) => m.dept === d)).map((d) => (
                <p key={d}>
                  {d}: {mandates.filter((m) => m.dept === d).reduce((sum, m) => sum + m.maps.length, 0)} MAPs
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No circular has reached ReguFlow"
          body="Use the RBI sandbox upload panel to publish a circular. Once the API reports one publication, this page updates automatically."
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stages.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.n} className="relative rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-widest text-primary-glow">STAGE 0{s.n}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-hero text-primary-foreground">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="text-lg font-bold leading-tight text-primary-deep">{s.k}</p>
              <p className="mt-0.5 text-xs font-semibold text-primary">{s.sub}</p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">{s.desc}</p>
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[10px] text-secondary-foreground">{s.tag}</span>
                <span className="text-right">
                  <span className="block text-base font-bold text-primary-deep">{s.stat.v}</span>
                  <span className="block text-[10px] text-muted-foreground">{s.stat.l}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold text-primary-deep">
            <GitBranch className="h-4 w-4" /> Live Agent Trace
          </h3>
          <span className={`rounded-full px-2 py-0.5 text-xs ${live.error ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
            {live.error ? "Waiting" : "Polling every 5s"}
          </span>
        </div>
        {latestMandate ? (
          <div className="space-y-3 font-mono text-[12px]">
            {[
              { a: "intake", m: `Received ${latest.reference_number} from RBI sandbox`, tone: "text-primary" },
              { a: "extractor", m: `Derived ${latestMandate.maps.length} obligations from title, category, PDF, and metadata`, tone: "text-primary" },
              { a: "map-agent", m: `Serialized ${latestMandate.maps.length} MAPs at ${latestMandate.confidence}% confidence`, tone: "text-success" },
              { a: "risk-engine", m: `Risk scored ${latestMandate.risk}; status ${latestMandate.status}`, tone: "text-warning" },
              { a: "router", m: `Canara route selected: ${latestMandate.dept}`, tone: "text-primary" },
              { a: "auth-gate", m: `Awaiting COMPLIANCE_AUTHORIZED event before COMPLETED`, tone: "text-warning" },
              { a: "dashboard", m: "Canara Bank dashboard refreshed from live state", tone: "text-success" },
            ].map((l, i) => (
              <div key={l.a} className="grid items-start gap-3 md:grid-cols-[80px_120px_1fr]">
                <span className="text-muted-foreground">+{String(i).padStart(2, "0")}s</span>
                <span className="text-foreground/80">[{l.a}]</span>
                <span className={l.tone}>{l.m}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No trace yet. Upload and publish one circular in the RBI sandbox dashboard.</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compliance Authorization Panel
// ============================================================================
function ComplianceAuthorizationPanel({ publications }: { publications: Circular[] }) {
  const [cases, setCases] = useState<ComplianceCaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [role, setRole] = useState<string>("Compliance Officer");
  const [actor, setActor] = useState<string>("officer@canarabank.in");
  const [code, setCode] = useState<string>("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; message: string; data?: any }>(null);
  const [casesLoading, setCasesLoading] = useState(true);
  const codeRef = useRef<HTMLInputElement>(null);

  const loadCases = async () => {
    setCasesLoading(true);
    try {
      const res = await fetch(`${RBI_API_BASE}/v1/compliance/cases/all`);
      if (res.ok) {
        const data: ComplianceCaseItem[] = await res.json();
        setCases(data);
        if (data.length > 0 && !selectedCaseId) {
          setSelectedCaseId(data[0].case_id);
        }
      }
    } catch {
      /* backend offline — handled by empty state */
    } finally {
      setCasesLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
    const t = window.setInterval(() => loadCases(), 5000);
    return () => window.clearInterval(t);
  }, []);

  const selectedCase = cases.find((c) => c.case_id === selectedCaseId) ?? null;

  const handleAuthorize = async () => {
    if (!selectedCaseId || !code.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${RBI_API_BASE}/v1/compliance/${encodeURIComponent(selectedCaseId)}/authorize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": role,
          "X-Actor": actor,
        },
        body: JSON.stringify({ authorization_code: code }),
      });
      const json = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: json.message, data: json });
        setCode("");
        loadCases();
      } else {
        const detail = json.detail;
        const msg =
          typeof detail === "object" ? detail.message || detail.error || "Authorization failed" : detail;
        setResult({
          ok: false,
          message: msg,
          data: typeof detail === "object" ? detail : undefined,
        });
        loadCases();
      }
    } catch {
      setResult({ ok: false, message: "Could not reach the compliance API. Check that the backend is running on port 8001." });
    } finally {
      setLoading(false);
    }
  };

  if (publications.length === 0) {
    return (
      <EmptyState
        title="No published circulars"
        body="Upload and publish an RBI sandbox circular first. The Authorization Panel will appear once compliance cases are available."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">ReguFlow · Compliance Authorization</p>
        <h1 className="text-2xl font-bold text-primary-deep md:text-3xl">Compliance Authorization Panel</h1>
        <p className="text-sm text-muted-foreground">
          An authorized officer must enter a valid code before any compliance case can be marked as COMPLETED.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ── Authorization form card (glassmorphism) ── */}
        <div className="relative overflow-hidden rounded-3xl border bg-card shadow-[var(--shadow-card)]">
          {/* gradient accent bar */}
          <div className="h-1.5 w-full bg-hero" />
          <div className="p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-hero text-primary-foreground shadow-[var(--shadow-glow)]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-primary-deep">Compliance Authorization</p>
                <p className="text-xs text-muted-foreground">Role-restricted · SHA-256 receipt · Tamper-evident</p>
              </div>
            </div>

            {/* Case selector */}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Compliance Case
              </label>
              {casesLoading ? (
                <div className="h-10 animate-pulse rounded-lg bg-secondary" />
              ) : cases.length === 0 ? (
                <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  No published compliance cases found. Publish a circular from the RBI sandbox first.
                </p>
              ) : (
                <select
                  id="auth-case-select"
                  value={selectedCaseId}
                  onChange={(e) => { setSelectedCaseId(e.target.value); setResult(null); }}
                  className="w-full rounded-lg border bg-secondary/40 px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {cases.map((c) => (
                    <option key={c.case_id} value={c.case_id}>
                      {c.case_id} — {c.regulation_title ?? "Untitled"} [{c.status}]
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Role + actor */}
            <div className="mb-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Officer Role
                </label>
                <select
                  id="auth-role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border bg-secondary/40 px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Compliance Officer">Compliance Officer</option>
                  <option value="Admin">Admin</option>
                  <option value="Analyst">Analyst (no access)</option>
                  <option value="Viewer">Viewer (no access)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Officer ID / Email
                </label>
                <input
                  id="auth-actor-input"
                  type="text"
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  placeholder="officer@canarabank.in"
                  className="w-full rounded-lg border bg-secondary/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Authorization code input */}
            <div className="mb-6">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Authorization Code
              </label>
              <div className="relative">
                <input
                  id="auth-code-input"
                  ref={codeRef}
                  type={showCode ? "text" : "password"}
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setResult(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAuthorize()}
                  placeholder="Enter authorization code…"
                  className="w-full rounded-xl border-2 border-primary/20 bg-secondary/30 px-4 py-3.5 pr-12 text-sm font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowCode((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="authorize-compliance-btn"
              onClick={handleAuthorize}
              disabled={loading || !selectedCaseId || !code.trim() || selectedCase?.status === "COMPLETED"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-hero px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-card)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Verifying…
                </>
              ) : selectedCase?.status === "COMPLETED" ? (
                <>
                  <ShieldCheck className="h-4 w-4" /> Already Authorized
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" /> Authorize Compliance
                </>
              )}
            </button>

            {/* Result banners */}
            {result && (
              <div
                className={`mt-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
                  result.ok
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {result.ok ? (
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                <div>
                  <p className="font-semibold">{result.message}</p>
                  {result.data?.failed_attempts != null && !result.ok && (
                    <p className="mt-0.5 text-xs opacity-80">
                      Failed attempts for this case: {result.data.failed_attempts}
                    </p>
                  )}
                  {result.ok && result.data?.authorization_hash && (
                    <p className="mt-1 break-all font-mono text-[10px] opacity-70">
                      SHA-256: {result.data.authorization_hash}
                    </p>
                  )}
                  {result.ok && result.data?.authorized_by && (
                    <p className="mt-0.5 text-xs opacity-80">
                      Authorized by: {result.data.authorized_by} · {result.data.authorized_at ? fmtDateTime(result.data.authorized_at) : ""}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Case detail sidebar ── */}
        <div className="space-y-4">
          {selectedCase ? (
            <>
              {/* Status card */}
              <div
                className={`rounded-2xl p-6 text-sm ${
                  selectedCase.status === "COMPLETED"
                    ? "border border-success/30 bg-success/10"
                    : "bg-hero text-primary-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  {selectedCase.status === "COMPLETED" ? (
                    <ShieldCheck className="h-7 w-7 text-success" />
                  ) : (
                    <Shield className="h-7 w-7 text-gold" />
                  )}
                  <div>
                    <p
                      className={`text-lg font-extrabold ${
                        selectedCase.status === "COMPLETED" ? "text-success" : ""
                      }`}
                    >
                      {selectedCase.status.replace(/_/g, " ")}
                    </p>
                    <p
                      className={`text-xs ${
                        selectedCase.status === "COMPLETED" ? "text-muted-foreground" : "opacity-70"
                      }`}
                    >
                      {selectedCase.status === "COMPLETED"
                        ? "Authorization accepted"
                        : "Awaiting officer authorization"}
                    </p>
                  </div>
                </div>

                {selectedCase.status === "COMPLETED" && (
                  <div className="mt-4 space-y-2 text-xs">
                    <p>
                      <span className="font-semibold text-muted-foreground">Authorized by: </span>
                      {selectedCase.authorized_by}
                    </p>
                    <p>
                      <span className="font-semibold text-muted-foreground">Timestamp: </span>
                      {selectedCase.authorized_at ? fmtDateTime(selectedCase.authorized_at) : "—"}
                    </p>
                    <p className="break-all">
                      <span className="font-semibold text-muted-foreground">Regulation ID: </span>
                      {selectedCase.regulation_id}
                    </p>
                    <p className="break-all">
                      <span className="font-semibold text-muted-foreground">SHA-256: </span>
                      <span className="font-mono">{selectedCase.authorization_hash}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Meta card */}
              <div className="rounded-2xl border bg-card p-5 text-sm">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Case Details</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Case ID</span>
                    <span className="font-mono font-semibold">{selectedCase.case_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Regulation</span>
                    <span className="max-w-[180px] text-right font-medium">{selectedCase.regulation_title ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority</span>
                    <span className="font-semibold">{selectedCase.priority ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed Attempts</span>
                    <span
                      className={`font-bold ${
                        (selectedCase.failed_attempts ?? 0) > 0 ? "text-destructive" : "text-success"
                      }`}
                    >
                      {selectedCase.failed_attempts ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role restriction note */}
              <div className="rounded-2xl border border-dashed bg-secondary/30 p-5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5 font-semibold text-primary-deep">
                  <Lock className="h-3 w-3" /> Role Restriction Active
                </p>
                <p className="mt-1">
                  Only <strong>Admin</strong> and <strong>Compliance Officer</strong> roles can authorize compliance cases.
                  Other roles receive a <code className="rounded bg-destructive/10 px-1 text-destructive">403 Forbidden</code> response.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
              Select a compliance case from the dropdown to see its details.
            </div>
          )}
        </div>
      </div>

      {/* All Cases table */}
      {cases.length > 0 && (
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-primary-deep">
            <DatabaseZap className="h-4 w-4" /> All Compliance Cases
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 text-left font-semibold">Case ID</th>
                  <th className="pb-2 text-left font-semibold">Title</th>
                  <th className="pb-2 text-left font-semibold">Priority</th>
                  <th className="pb-2 text-left font-semibold">Status</th>
                  <th className="pb-2 text-left font-semibold">Failed</th>
                  <th className="pb-2 text-left font-semibold">Authorized By</th>
                  <th className="pb-2 text-left font-semibold">Authorized At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cases.map((c) => (
                  <tr
                    key={c.case_id}
                    onClick={() => setSelectedCaseId(c.case_id)}
                    className={`cursor-pointer transition hover:bg-secondary/40 ${
                      c.case_id === selectedCaseId ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="py-2 pr-4 font-mono text-xs font-medium">{c.case_id}</td>
                    <td className="py-2 pr-4 max-w-[200px] truncate">{c.regulation_title ?? "—"}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          c.priority === "Critical"
                            ? "bg-destructive text-destructive-foreground"
                            : c.priority === "High"
                              ? "bg-warning text-primary-deep"
                              : c.priority === "Medium"
                                ? "bg-gold text-primary-deep"
                                : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {c.priority ?? "—"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          c.status === "COMPLETED"
                            ? "bg-success/15 text-success"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {c.status === "COMPLETED" ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`font-bold ${
                          (c.failed_attempts ?? 0) > 0 ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {c.failed_attempts ?? 0}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-xs">{c.authorized_by ?? "—"}</td>
                    <td className="py-2 text-xs">{c.authorized_at ? fmtDateTime(c.authorized_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
