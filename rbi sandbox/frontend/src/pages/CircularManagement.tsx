import { useEffect, useState } from 'react';
import {
  api, Circular, CreateCircularPayload,
  priorityClass, statusClass, categoryClass,
  fmtDate, fmtDateTime,
  CircularCategory, Priority, CircularStatus,
} from '../api/client';

const CATEGORIES: CircularCategory[] = [
  'Cyber Advisory', 'Fraud Alert', 'Data Security Circular', 'Compliance Notice', 'Master Direction',
];
const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
const DEPARTMENTS = [
  'IT Security', 'Core Banking', 'Risk Management', 'Compliance', 'Digital Banking',
  'CISO Office', 'IT Operations', 'Legal', 'Customer Experience', 'Finance',
];

const EMPTY: CreateCircularPayload = {
  reference_number: '', title: '', category: 'Cyber Advisory', priority: 'Medium',
  summary: '', full_content: '', target_departments: [], status: 'Draft',
  issue_date: '', effective_date: '',
};

export default function CircularManagement() {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Circular | null>(null);
  const [form, setForm] = useState<CreateCircularPayload>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');
  const [viewCircular, setViewCircular] = useState<Circular | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.listCirculars();
      setCirculars(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const openEdit = (c: Circular) => {
    setEditTarget(c);
    setForm({
      reference_number: c.reference_number,
      title: c.title,
      category: c.category,
      priority: c.priority,
      summary: c.summary ?? '',
      full_content: c.full_content ?? '',
      target_departments: c.target_departments ?? [],
      status: c.status,
      issue_date: c.issue_date ?? '',
      effective_date: c.effective_date ?? '',
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDeptToggle = (dept: string) => {
    setForm(f => ({
      ...f,
      target_departments: f.target_departments?.includes(dept)
        ? f.target_departments.filter(d => d !== dept)
        : [...(f.target_departments ?? []), dept],
    }));
  };

  const handleSave = async (publishAfter = false) => {
    if (!form.reference_number || !form.title) {
      setError('Reference Number and Title are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let saved: Circular;
      if (editTarget) {
        saved = await api.updateCircular(editTarget.id, form);
      } else {
        saved = await api.createCircular(form);
      }
      if (publishAfter) {
        await api.publishCircular(saved.id);
        setSuccess(`Circular ${saved.reference_number} saved and published.`);
      } else {
        setSuccess(`Circular ${saved.reference_number} saved as draft.`);
      }
      setShowForm(false);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = circulars.filter(c => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterCat && c.category !== filterCat) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
        !c.reference_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <div className="section-header">
        <span className="section-title">Circular Management</span>
        <button id="btn-new-circular" className="ml-auto btn btn-primary" onClick={openCreate}>
          + New Circular
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-300 text-green-800 text-sm rounded px-4 py-2 flex justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body flex flex-wrap gap-3 items-center">
          <input
            id="search-circulars"
            type="text"
            className="form-input w-56"
            placeholder="Search title or ref. no."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select id="filter-status" className="form-select w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Draft</option>
            <option>Published</option>
            <option>Archived</option>
          </select>
          <select id="filter-category" className="form-select w-52" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterCat(''); }}>
            Clear
          </button>
          <span className="ml-auto text-xs text-drbi-muted">{filtered.length} record(s)</span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-drbi-muted text-sm font-mono animate-pulse">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="drbi-table">
              <thead>
                <tr>
                  <th>Ref. No.</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-drbi-muted">No circulars found.</td></tr>
                )}
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="font-mono text-xs text-drbi-blue whitespace-nowrap">{c.reference_number}</td>
                    <td className="max-w-[220px]">
                      <span className="block truncate font-medium" title={c.title}>{c.title}</span>
                    </td>
                    <td><span className={categoryClass(c.category)}>{c.category}</span></td>
                    <td><span className={priorityClass(c.priority)}>{c.priority}</span></td>
                    <td><span className={statusClass(c.status)}>{c.status}</span></td>
                    <td className="text-xs whitespace-nowrap">{c.issue_date || '—'}</td>
                    <td className="text-xs whitespace-nowrap">{fmtDate(c.created_at)}</td>
                    <td className="whitespace-nowrap">
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-sm" onClick={() => setViewCircular(c)}>View</button>
                        {c.status === 'Draft' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-drbi-navy text-white px-6 py-4 flex items-center justify-between rounded-t">
              <h2 className="font-bold text-base">
                {editTarget ? `Edit Circular — ${editTarget.reference_number}` : 'Create New Circular'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Reference Number *</label>
                  <input
                    id="field-ref-number"
                    className="form-input"
                    placeholder="DRBI-2026-XXX"
                    value={form.reference_number}
                    disabled={!!editTarget}
                    onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Priority *</label>
                  <select id="field-priority" className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Title *</label>
                <input
                  id="field-title"
                  className="form-input"
                  placeholder="Enter circular title"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category *</label>
                  <select id="field-category" className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as CircularCategory }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select id="field-status" className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CircularStatus }))}>
                    <option>Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Issue Date</label>
                  <input id="field-issue-date" type="date" className="form-input" value={form.issue_date ?? ''} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Effective Date</label>
                  <input id="field-effective-date" type="date" className="form-input" value={form.effective_date ?? ''} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="form-label">Summary</label>
                <textarea
                  id="field-summary"
                  className="form-textarea"
                  rows={3}
                  placeholder="Brief summary of this circular..."
                  value={form.summary ?? ''}
                  onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                />
              </div>

              <div>
                <label className="form-label">Full Regulatory Content</label>
                <textarea
                  id="field-full-content"
                  className="form-textarea"
                  rows={8}
                  placeholder="Enter the full text of the regulatory circular..."
                  value={form.full_content ?? ''}
                  onChange={e => setForm(f => ({ ...f, full_content: e.target.value }))}
                />
              </div>

              <div>
                <label className="form-label">Target Departments</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {DEPARTMENTS.map(d => (
                    <label key={d} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.target_departments?.includes(d) ?? false}
                        onChange={() => handleDeptToggle(d)}
                        className="rounded border-drbi-border"
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-drbi-border px-6 py-4 flex gap-3 rounded-b">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
              <button id="btn-save-draft" className="btn btn-primary" onClick={() => handleSave(false)} disabled={saving}>
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button id="btn-save-publish" className="btn btn-success" onClick={() => handleSave(true)} disabled={saving}>
                {saving ? 'Publishing...' : 'Save & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewCircular && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-drbi-navy text-white px-6 py-4 flex items-center justify-between rounded-t">
              <h2 className="font-bold text-sm">{viewCircular.reference_number} — {viewCircular.title}</h2>
              <button onClick={() => setViewCircular(null)} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="form-label">Category</span><span className={categoryClass(viewCircular.category)}>{viewCircular.category}</span></div>
                <div><span className="form-label">Priority</span><span className={priorityClass(viewCircular.priority)}>{viewCircular.priority}</span></div>
                <div><span className="form-label">Status</span><span className={statusClass(viewCircular.status)}>{viewCircular.status}</span></div>
                <div><span className="form-label">Issue Date</span><p>{viewCircular.issue_date || '—'}</p></div>
                <div><span className="form-label">Effective Date</span><p>{viewCircular.effective_date || '—'}</p></div>
                <div><span className="form-label">Published</span><p>{fmtDateTime(viewCircular.published_at)}</p></div>
              </div>
              {viewCircular.target_departments?.length > 0 && (
                <div>
                  <span className="form-label">Target Departments</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewCircular.target_departments.map(d => (
                      <span key={d} className="badge badge-datasec">{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {viewCircular.summary && (
                <div>
                  <span className="form-label">Summary</span>
                  <p className="text-sm text-drbi-dark mt-1 bg-drbi-light p-3 rounded border border-drbi-border">{viewCircular.summary}</p>
                </div>
              )}
              {viewCircular.full_content && (
                <div>
                  <span className="form-label">Full Content</span>
                  <pre className="text-xs text-drbi-dark mt-1 bg-gray-50 p-4 rounded border border-drbi-border whitespace-pre-wrap font-mono leading-relaxed">
                    {viewCircular.full_content}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
