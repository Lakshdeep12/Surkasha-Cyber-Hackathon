import { useEffect, useState, useRef, Fragment } from 'react';
import { api, Circular, priorityClass, categoryClass, fmtDate } from '../api/client';

export default function PublishRegulation() {
  const [drafts, setDrafts] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ [id: number]: File }>({});
  const fileRefs = useRef<{ [id: number]: HTMLInputElement | null }>({});

  const load = async () => {
    try {
      setLoading(true);
      const all = await api.listCirculars({ status: 'Draft' });
      setDrafts(all);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = (id: number, file: File | undefined) => {
    if (!file) return;
    setSelectedFile(prev => ({ ...prev, [id]: file }));
  };

  const handleUpload = async (id: number) => {
    const file = selectedFile[id];
    if (!file) { setError('Please select a PDF file first.'); return; }
    try {
      setUploading(id);
      setError(null);
      await api.uploadPdf(id, file);
      setSuccess(`PDF "${file.name}" uploaded successfully.`);
      setSelectedFile(prev => { const n = { ...prev }; delete n[id]; return n; });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(null);
    }
  };

  const handlePublish = async (id: number, refNum: string) => {
    if (!window.confirm(`Publish circular ${refNum}? This action cannot be undone.`)) return;
    try {
      setPublishing(id);
      setError(null);
      await api.publishCircular(id);
      setSuccess(`Circular ${refNum} published successfully. Event generated.`);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPublishing(null);
    }
  };

  return (
    <div className="page-container space-y-5">
      <div className="section-header">
        <span className="section-title">Publish Regulation</span>
        <span className="ml-auto text-xs text-drbi-muted">
          {drafts.length} draft(s) awaiting publication
        </span>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-300 text-green-800 text-sm rounded px-4 py-2 flex justify-between items-start">
          <div>
            <strong>✓ </strong>{success}
            <div className="text-xs mt-0.5 text-green-700">A REGULATION_PUBLISHED event has been dispatched to the Event Feed.</div>
          </div>
          <button onClick={() => setSuccess(null)} className="ml-4 text-green-600">✕</button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-2 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Workflow Info */}
      <div className="bg-drbi-light border border-drbi-border rounded px-5 py-4">
        <div className="text-xs font-semibold text-drbi-navy uppercase tracking-wide mb-3">Publication Workflow</div>
        <div className="flex items-center gap-2 text-sm text-drbi-dark">
          {['Create Circular', 'Upload PDF (optional)', 'Publish Regulation', 'Event Generated', 'Visible in Feed'].map((step, i, arr) => (
            <Fragment key={step}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${i === 2 ? 'bg-drbi-navy text-white' : 'bg-white border border-drbi-border text-drbi-muted'
                }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${i === 2 ? 'bg-drbi-gold text-drbi-navy' : 'bg-drbi-border text-drbi-muted'
                  }`}>{i + 1}</span>
                {step}
              </div>
              {i < arr.length - 1 && <span className="text-drbi-border">→</span>}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Draft Circulars */}
      {loading ? (
        <div className="p-8 text-center text-drbi-muted font-mono text-sm animate-pulse">Loading drafts...</div>
      ) : drafts.length === 0 ? (
        <div className="card p-10 text-center text-drbi-muted">
          <div className="text-4xl mb-3">📭</div>
          <div className="font-medium">No draft circulars pending publication.</div>
          <div className="text-xs mt-1">Create a new circular in Circular Management to get started.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map(c => (
            <div key={c.id} className="card">
              <div className="card-header flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-drbi-navy">{c.reference_number}</span>
                <span className="text-sm font-medium text-drbi-dark">{c.title}</span>
                <span className={`ml-auto ${categoryClass(c.category)}`}>{c.category}</span>
                <span className={priorityClass(c.priority)}>{c.priority}</span>
              </div>
              <div className="card-body space-y-4">
                {c.summary && (
                  <p className="text-sm text-drbi-muted border-l-2 border-drbi-gold pl-3">{c.summary}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-drbi-muted">
                  <span>Issue Date: <strong>{c.issue_date || '—'}</strong></span>
                  <span>Effective: <strong>{c.effective_date || '—'}</strong></span>
                  <span>Created: <strong>{fmtDate(c.created_at)}</strong></span>
                  {c.pdf_path && (
                    <span className="text-green-700 font-semibold">✓ PDF Attached: {c.pdf_path}</span>
                  )}
                </div>

                {/* PDF Upload */}
                <div className="bg-gray-50 border border-dashed border-drbi-border rounded p-4">
                  <div className="text-xs font-semibold text-drbi-muted uppercase mb-2 tracking-wide">
                    PDF Attachment {c.pdf_path ? '(Replace)' : '(Optional)'}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id={`pdf-upload-${c.id}`}
                      type="file"
                      accept=".pdf"
                      ref={el => { fileRefs.current[c.id] = el; }}
                      onChange={e => handleFileChange(c.id, e.target.files?.[0])}
                      className="text-xs text-drbi-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border
                                 file:border-drbi-border file:text-xs file:font-medium file:bg-white file:text-drbi-navy
                                 file:cursor-pointer hover:file:bg-drbi-light"
                    />
                    {selectedFile[c.id] && (
                      <button
                        id={`btn-upload-${c.id}`}
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleUpload(c.id)}
                        disabled={uploading === c.id}
                      >
                        {uploading === c.id ? 'Uploading...' : '↑ Upload PDF'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Publish Button */}
                <div className="flex justify-end pt-2 border-t border-drbi-border">
                  <button
                    id={`btn-publish-${c.id}`}
                    className="btn btn-success"
                    onClick={() => handlePublish(c.id, c.reference_number)}
                    disabled={publishing === c.id}
                  >
                    {publishing === c.id
                      ? 'Publishing...'
                      : 'Publish Regulation'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
