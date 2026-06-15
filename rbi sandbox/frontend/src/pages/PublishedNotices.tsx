import { useEffect, useState } from 'react';
import { api, Circular, priorityClass, statusClass, categoryClass, fmtDateTime } from '../api/client';

export default function PublishedNotices() {
  const [pubs, setPubs] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewCircular, setViewCircular] = useState<Circular | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterPri, setFilterPri] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getPublications();
      setPubs(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleArchive = async (c: Circular) => {
    if (!window.confirm(`Archive circular ${c.reference_number}?`)) return;
    try {
      await api.updateCircular(c.id, { status: 'Archived' });
      setSuccess(`${c.reference_number} archived.`);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDownload = (c: Circular) => {
    if (!c.pdf_path) {
      alert('No PDF attached to this circular.');
      return;
    }
    window.open(api.downloadPdfUrl(c.id), '_blank');
  };

  const filtered = pubs.filter(c => {
    if (filterCat && c.category !== filterCat) return false;
    if (filterPri && c.priority !== filterPri) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
        !c.reference_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = [...new Set(pubs.map(p => p.category))];

  return (
    <div className="page-container space-y-5">
      <div className="section-header">
        <span className="section-title">Published Notices</span>
        <span className="ml-auto text-xs text-drbi-muted">{filtered.length} notice(s)</span>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-300 text-green-800 text-sm rounded px-4 py-2 flex justify-between">
          <span>✓ {success}</span><button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-2 flex justify-between">
          <span>{error}</span><button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body flex flex-wrap gap-3 items-center">
          <input
            id="search-notices"
            type="text"
            className="form-input w-56"
            placeholder="Search title or ref. no."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select id="filter-notice-cat" className="form-select w-52" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select id="filter-notice-pri" className="form-select w-36" value={filterPri} onChange={e => setFilterPri(e.target.value)}>
            <option value="">All Priorities</option>
            {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterCat(''); setFilterPri(''); }}>Clear</button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-drbi-muted font-mono text-sm animate-pulse">Loading publications...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="drbi-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Reference Number</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Published At</th>
                  <th>PDF</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-8 text-drbi-muted">No published notices found.</td></tr>
                )}
                {filtered.map((c, i) => (
                  <tr key={c.id}>
                    <td className="text-xs text-drbi-muted">{i + 1}</td>
                    <td className="font-mono text-xs text-drbi-blue whitespace-nowrap">{c.reference_number}</td>
                    <td className="max-w-[200px]">
                      <span className="block truncate font-medium text-drbi-dark" title={c.title}>{c.title}</span>
                    </td>
                    <td><span className={categoryClass(c.category)}>{c.category}</span></td>
                    <td><span className={priorityClass(c.priority)}>{c.priority}</span></td>
                    <td className="text-xs whitespace-nowrap">{fmtDateTime(c.published_at)}</td>
                    <td className="text-xs">
                      {c.pdf_path
                        ? <span className="text-green-700 font-semibold">✓ PDF</span>
                        : <span className="text-gray-400">None</span>
                      }
                    </td>
                    <td><span className={statusClass(c.status)}>{c.status}</span></td>
                    <td className="whitespace-nowrap">
                      <div className="flex gap-1">
                        <button
                          id={`btn-view-${c.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={() => setViewCircular(c)}
                        >
                          View
                        </button>
                        <button
                          id={`btn-download-${c.id}`}
                          className={`btn btn-sm ${c.pdf_path ? 'btn-secondary' : 'btn-ghost opacity-40'}`}
                          onClick={() => handleDownload(c)}
                          title={c.pdf_path ? 'Download PDF' : 'No PDF attached'}
                        >
                          ↓ PDF
                        </button>
                        {c.status === 'Published' && (
                          <button
                            id={`btn-archive-${c.id}`}
                            className="btn btn-ghost btn-sm text-purple-700"
                            onClick={() => handleArchive(c)}
                          >
                            Archive
                          </button>
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

      {/* View Modal */}
      {viewCircular && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-drbi-navy text-white px-6 py-4 flex items-center justify-between rounded-t">
              <div>
                <div className="font-mono text-drbi-gold text-xs">{viewCircular.reference_number}</div>
                <div className="font-bold text-sm mt-0.5">{viewCircular.title}</div>
              </div>
              <button onClick={() => setViewCircular(null)} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="form-label">Category</span><div className="mt-1"><span className={categoryClass(viewCircular.category)}>{viewCircular.category}</span></div></div>
                <div><span className="form-label">Priority</span><div className="mt-1"><span className={priorityClass(viewCircular.priority)}>{viewCircular.priority}</span></div></div>
                <div><span className="form-label">Status</span><div className="mt-1"><span className={statusClass(viewCircular.status)}>{viewCircular.status}</span></div></div>
                <div><span className="form-label">Issue Date</span><p className="mt-1 text-sm">{viewCircular.issue_date || '—'}</p></div>
                <div><span className="form-label">Effective Date</span><p className="mt-1 text-sm">{viewCircular.effective_date || '—'}</p></div>
                <div><span className="form-label">Published At</span><p className="mt-1 text-sm">{fmtDateTime(viewCircular.published_at)}</p></div>
              </div>
              {viewCircular.target_departments?.length > 0 && (
                <div>
                  <span className="form-label">Target Departments</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewCircular.target_departments.map(d => <span key={d} className="badge badge-datasec">{d}</span>)}
                  </div>
                </div>
              )}
              {viewCircular.summary && (
                <div>
                  <span className="form-label">Summary</span>
                  <p className="text-sm mt-1 bg-drbi-light p-3 rounded border border-drbi-border">{viewCircular.summary}</p>
                </div>
              )}
              {viewCircular.full_content && (
                <div>
                  <span className="form-label">Full Regulatory Text</span>
                  <pre className="text-xs mt-1 bg-gray-50 p-4 rounded border border-drbi-border whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                    {viewCircular.full_content}
                  </pre>
                </div>
              )}
              {viewCircular.pdf_path && (
                <div className="flex gap-2 pt-2">
                  <a
                    href={api.downloadPdfUrl(viewCircular.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    ↓ Download PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
