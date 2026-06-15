import { useEffect, useState } from 'react';
import { api, DashboardStats, fmtDate, fmtDateTime, priorityClass } from '../api/client';

export default function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetch('/api/stats').then(r => r.json());
      setStats(data);
      setError(null);
    } catch (e: any) {
      setError('Unable to connect to DRBI API server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="page-container">
      <div className="flex items-center justify-center h-64 text-drbi-muted font-mono text-sm animate-pulse">
        Loading regulatory data...
      </div>
    </div>
  );

  if (error) return (
    <div className="page-container">
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800 text-sm">
        <strong>Connection Error:</strong> {error}
        <div className="mt-1 text-xs">Ensure the FastAPI server is running on port 8000.</div>
        <button className="mt-2 btn btn-secondary btn-sm" onClick={load}>Retry</button>
      </div>
    </div>
  );

  const s = stats!;

  const statCards = [
    {
      label: 'Total Circulars',
      value: s.total_circulars,
      color: 'border-l-drbi-navy',
      icon: '📋',
      sub: 'All regulations in system',
    },
    {
      label: 'Draft Circulars',
      value: s.draft_circulars,
      color: 'border-l-yellow-500',
      icon: '✏️',
      sub: 'Awaiting publication',
    },
    {
      label: 'Published Circulars',
      value: s.published_circulars,
      color: 'border-l-green-600',
      icon: '✅',
      sub: 'Live regulations',
    },
    {
      label: 'Critical Advisories',
      value: s.critical_advisories,
      color: 'border-l-red-600',
      icon: '🔴',
      sub: 'Requires immediate attention',
    },
  ];

  return (
    <div className="page-container space-y-6">
      {/* Page Title */}
      <div className="section-header">
        <span className="section-title">Regulatory Dashboard</span>
        <span className="ml-auto text-xs text-drbi-muted font-mono">
          Last updated: {fmtDateTime(new Date().toISOString())}
        </span>
        <button className="btn btn-ghost btn-sm ml-2" onClick={load}>↻ Refresh</button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(c => (
          <div key={c.label} className={`stat-card border-l-4 ${c.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{c.icon}</span>
              <span className="text-3xl font-black text-drbi-navy">{c.value}</span>
            </div>
            <div className="mt-2 text-sm font-semibold text-drbi-dark">{c.label}</div>
            <div className="text-xs text-drbi-muted">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Publications */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span className="text-sm font-bold text-drbi-navy uppercase tracking-wide">
              Recent Publications
            </span>
            <button
              className="btn btn-ghost btn-sm text-drbi-blue"
              onClick={() => onNavigate('notices')}
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            {s.recent_publications.length === 0 ? (
              <div className="p-6 text-center text-drbi-muted text-sm">No published circulars yet.</div>
            ) : (
              <table className="drbi-table">
                <thead>
                  <tr>
                    <th>Ref. No.</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recent_publications.map((p: any) => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs text-drbi-blue whitespace-nowrap">{p.reference_number}</td>
                      <td className="max-w-[180px]">
                        <span className="truncate block" title={p.title}>{p.title}</span>
                      </td>
                      <td><span className={priorityClass(p.priority)}>{p.priority}</span></td>
                      <td className="whitespace-nowrap text-xs">{fmtDate(p.published_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span className="text-sm font-bold text-drbi-navy uppercase tracking-wide">
              Recent Events
            </span>
            <button
              className="btn btn-ghost btn-sm text-drbi-blue"
              onClick={() => onNavigate('events')}
            >
              View Feed →
            </button>
          </div>
          <div className="terminal-panel" style={{ height: '280px' }}>
            {s.recent_events.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">No events yet.</div>
            ) : (
              s.recent_events.map((ev: any, i) => (
                <div key={ev.id ?? i} className="terminal-line event-new">
                  <span className="text-gray-500">[{fmtDateTime(ev.timestamp)}]</span>
                  {' '}
                  <span className={
                    ev.priority === 'Critical' ? 'text-red-400' :
                    ev.priority === 'High' ? 'text-orange-400' : 'text-green-400'
                  }>
                    {ev.event_type}
                  </span>
                  {' '}
                  <span className="text-blue-400">{ev.regulation_id}</span>
                  {' '}
                  <span className="text-gray-400 truncate">— {ev.regulation_title}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Info Bar */}
      <div className="bg-drbi-navy text-white rounded px-5 py-3 flex items-center gap-4 text-xs font-mono">
        <span className="text-drbi-gold font-semibold">DRBI SANDBOX v1.0</span>
        <span className="text-gray-400">|</span>
        <span>Database: SQLite (Local)</span>
        <span className="text-gray-400">|</span>
        <span>API: FastAPI :8000</span>
        <span className="text-gray-400">|</span>
        <span>Frontend: React :5173</span>
        <span className="ml-auto text-green-400">● OPERATIONAL</span>
      </div>
    </div>
  );
}
