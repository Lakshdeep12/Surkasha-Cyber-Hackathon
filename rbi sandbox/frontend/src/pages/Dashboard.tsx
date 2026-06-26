import { useEffect, useState } from 'react';
import {
  api,
  CircularCategory,
  DashboardStats,
  Priority,
  fmtDate,
  fmtDateTime,
  priorityClass,
} from '../api/client';

const ZERO_STATS: DashboardStats = {
  total_circulars: 0,
  draft_circulars: 0,
  published_circulars: 0,
  critical_advisories: 0,
  recent_publications: [],
  recent_events: [],
};

const titleFromFile = (name: string) =>
  name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase()) || 'Uploaded RBI Sandbox Circular';

const nextReference = () => {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  return `RBI-SBX-${stamp}`;
};

export default function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [stats, setStats] = useState<DashboardStats>(ZERO_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<CircularCategory>('Compliance Notice');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [title, setTitle] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data ?? ZERO_STATS);
      setError(null);
    } catch (e: any) {
      setError('Unable to connect to DRBI API server.');
      setStats(ZERO_STATS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = (nextFile: File | undefined) => {
    if (!nextFile) {
      setFile(null);
      return;
    }
    if (!nextFile.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF circulars can be uploaded.');
      setFile(null);
      return;
    }
    setFile(nextFile);
    setTitle(current => current || titleFromFile(nextFile.name));
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Choose an RBI sandbox circular PDF first.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    const ref = nextReference();
    try {
      const circular = await api.createCircular({
        reference_number: ref,
        title: title.trim() || titleFromFile(file.name),
        category,
        priority,
        summary: `Uploaded from RBI Sandbox file ${file.name}. Agent intake pending downstream processing.`,
        full_content: `Circular uploaded from RBI Sandbox.\n\nSource file: ${file.name}\nReference: ${ref}`,
        target_departments: ['Compliance', 'Risk Management'],
        status: 'Draft',
        issue_date: new Date().toISOString().slice(0, 10),
        effective_date: new Date().toISOString().slice(0, 10),
      });
      await api.uploadPdf(circular.id, file);
      await api.publishCircular(circular.id);
      setUploadSuccess(`${ref} uploaded, published, and reflected in the dashboard.`);
      setFile(null);
      setTitle('');
      await load();
    } catch (e: any) {
      setUploadError(e.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

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

  const s = stats;

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

      <div className="card border-l-4 border-l-drbi-blue">
        <div className="card-header flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-drbi-navy uppercase tracking-wide">
              RBI Sandbox Circular Upload
            </div>
            <div className="text-xs text-drbi-muted mt-0.5">
              Upload one PDF and the dashboard will update from 0 to the live uploaded count.
            </div>
          </div>
          <span className="badge badge-datasec">Live Intake</span>
        </div>
        <div className="card-body space-y-4">
          {uploadSuccess && (
            <div className="bg-green-50 border border-green-300 text-green-800 text-sm rounded px-4 py-2">
              ✓ {uploadSuccess}
            </div>
          )}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-2">
              {uploadError}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_160px_160px_auto] gap-3 items-end">
            <div>
              <label className="form-label">Circular PDF</label>
              <input
                id="dashboard-rbi-upload"
                type="file"
                accept=".pdf,application/pdf"
                className="form-input file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-drbi-border file:bg-white file:text-drbi-navy file:font-semibold"
                onChange={e => handleFileChange(e.target.files?.[0])}
                disabled={uploading}
              />
            </div>
            <div>
              <label className="form-label">Title</label>
              <input
                id="dashboard-rbi-title"
                className="form-input"
                placeholder="Auto-filled from file name"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={uploading}
              />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select
                className="form-select w-full"
                value={category}
                onChange={e => setCategory(e.target.value as CircularCategory)}
                disabled={uploading}
              >
                {['Cyber Advisory', 'Fraud Alert', 'Data Security Circular', 'Compliance Notice', 'Master Direction'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select
                className="form-select w-full"
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                disabled={uploading}
              >
                {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <button
              id="dashboard-upload-publish"
              className="btn btn-primary whitespace-nowrap"
              onClick={handleUpload}
              disabled={uploading || !file}
            >
              {uploading ? 'Processing...' : 'Upload & Publish'}
            </button>
          </div>
          <div className="text-xs text-drbi-muted">
            Current live state: <strong>{s.total_circulars}</strong> circular(s), <strong>{s.published_circulars}</strong> published,
            <strong> {s.recent_events.length}</strong> recent event(s).
          </div>
        </div>
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
              onClick={() => onNavigate('published')}
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
