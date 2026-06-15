import { useEffect, useState, useRef, useCallback } from 'react';
import { api, RegEvent } from '../api/client';

const PRIORITY_COLOR: Record<string, string> = {
  Critical: 'text-red-400',
  High:     'text-orange-400',
  Medium:   'text-yellow-400',
  Low:      'text-green-400',
};

const TYPE_COLOR: Record<string, string> = {
  REGULATION_PUBLISHED: 'text-cyan-400',
  REGULATION_UPDATED:   'text-blue-400',
  REGULATION_ARCHIVED:  'text-purple-400',
};

function priorityDot(p: string | null) {
  const cls = p === 'Critical' ? 'bg-red-500' :
              p === 'High'     ? 'bg-orange-400' :
              p === 'Medium'   ? 'bg-yellow-400' : 'bg-green-400';
  return <span className={`inline-block w-2 h-2 rounded-full ${cls} mr-1.5 flex-shrink-0`}></span>;
}

export default function EventFeed() {
  const [events, setEvents] = useState<RegEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastCount, setLastCount] = useState(0);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [scrollToNew, setScrollToNew] = useState(true);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.getEvents();
      setEvents(prev => {
        const prevIds = new Set(prev.map(e => e.id));
        const freshIds = new Set(data.filter(e => !prevIds.has(e.id)).map(e => e.id));
        if (freshIds.size > 0) {
          setNewIds(freshIds);
          setTimeout(() => setNewIds(new Set()), 3000);
        }
        setLastCount(data.length);
        return data;
      });
    } catch (_) {
      // silent fail on poll
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => load(true), 5000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, load]);

  const filtered = events.filter(e => {
    if (!filter) return true;
    return (
      e.regulation_id.toLowerCase().includes(filter.toLowerCase()) ||
      (e.regulation_title ?? '').toLowerCase().includes(filter.toLowerCase()) ||
      (e.category ?? '').toLowerCase().includes(filter.toLowerCase()) ||
      e.event_type.toLowerCase().includes(filter.toLowerCase())
    );
  });

  const fmtTs = (iso: string) => {
    const d = new Date(iso);
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  };

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <div className="section-header">
        <span className="section-title">Regulatory Event Feed</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-mono text-drbi-muted">{events.length} total event(s)</span>
          <button
            id="btn-refresh-events"
            className="btn btn-ghost btn-sm"
            onClick={() => load(false)}
          >
            ↻ Refresh
          </button>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input
              id="toggle-auto-refresh"
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-drbi-muted">Auto-refresh (5s)</span>
            {autoRefresh && <span className="blink text-green-500">●</span>}
          </label>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-mono">
        <span className="text-drbi-muted font-semibold uppercase tracking-wide">Priority:</span>
        <span className="text-red-500">● Critical</span>
        <span className="text-orange-400">● High</span>
        <span className="text-yellow-400">● Medium</span>
        <span className="text-green-400">● Low</span>
        <span className="mx-2 text-drbi-border">|</span>
        <span className="text-drbi-muted font-semibold uppercase tracking-wide">Event Type:</span>
        <span className="text-cyan-400">REGULATION_PUBLISHED</span>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <input
          id="filter-events"
          type="text"
          className="form-input w-72"
          placeholder="Filter by ref. no., title, category..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        {filter && (
          <span className="text-xs text-drbi-muted">{filtered.length} result(s)</span>
        )}
      </div>

      {/* Terminal Panel */}
      <div className="card overflow-hidden">
        <div className="bg-gray-900 px-4 py-2 flex items-center gap-3 border-b border-gray-800 rounded-t">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-gray-400 font-mono text-xs ml-2">
            drbi-event-feed — REGULATION_PUBLISHED stream
          </span>
          {autoRefresh && (
            <span className="ml-auto text-green-400 text-xs font-mono flex items-center gap-1">
              <span className="blink">●</span> LIVE
            </span>
          )}
        </div>

        <div className="terminal-panel" style={{ height: '520px' }}>
          {loading && events.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-mono text-sm animate-pulse">
              Connecting to event stream...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-600 font-mono text-sm">
              No events found.{filter ? ' (adjust filter)' : ''}
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="px-3 py-1.5 border-b border-gray-800 flex gap-2 text-gray-600 text-xs font-mono uppercase tracking-wide">
                <span className="w-40 flex-shrink-0">Timestamp</span>
                <span className="w-36 flex-shrink-0">Event Type</span>
                <span className="w-36 flex-shrink-0">Regulation ID</span>
                <span className="w-20 flex-shrink-0">Category</span>
                <span className="w-16 flex-shrink-0">Priority</span>
                <span className="flex-1">Title</span>
              </div>
              {filtered.map((ev, idx) => (
                <div
                  key={ev.id}
                  className={`terminal-line flex gap-2 items-start ${newIds.has(ev.id) ? 'event-new bg-green-950/30' : ''}`}
                >
                  <span className="text-gray-500 w-40 flex-shrink-0 whitespace-nowrap">
                    {fmtTs(ev.timestamp)}
                  </span>
                  <span className={`w-36 flex-shrink-0 font-semibold ${TYPE_COLOR[ev.event_type] ?? 'text-cyan-400'}`}>
                    {ev.event_type}
                  </span>
                  <span className="text-blue-400 w-36 flex-shrink-0 font-mono">{ev.regulation_id}</span>
                  <span className="text-gray-400 w-20 flex-shrink-0 truncate text-xs">{ev.category ?? '—'}</span>
                  <span className={`w-16 flex-shrink-0 flex items-center ${PRIORITY_COLOR[ev.priority ?? ''] ?? 'text-gray-400'}`}>
                    {priorityDot(ev.priority)}
                    {ev.priority ?? '—'}
                  </span>
                  <span className="flex-1 text-gray-300 truncate text-xs" title={ev.regulation_title ?? ''}>
                    {ev.regulation_title ?? ''}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      </div>

      {/* Event Detail Cards */}
      {filtered.length > 0 && (
        <div className="space-y-2">
          <div className="section-header">
            <span className="section-title">Event Details</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.slice(0, 6).map(ev => (
              <div
                key={ev.id}
                className={`card border-l-4 ${
                  ev.priority === 'Critical' ? 'border-l-red-500' :
                  ev.priority === 'High'     ? 'border-l-orange-400' :
                  ev.priority === 'Medium'   ? 'border-l-yellow-400' : 'border-l-green-500'
                } ${newIds.has(ev.id) ? 'ring-1 ring-green-400' : ''}`}
              >
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-gray-500">{ev.event_id}</span>
                    <span className={`text-xs font-bold ${PRIORITY_COLOR[ev.priority ?? ''] ?? 'text-gray-500'}`}>
                      {ev.priority}
                    </span>
                  </div>
                  <div className="font-mono text-sm font-bold text-drbi-navy">{ev.regulation_id}</div>
                  <div className="text-xs text-drbi-dark truncate" title={ev.regulation_title ?? ''}>{ev.regulation_title}</div>
                  <div className="flex items-center justify-between text-xs text-drbi-muted">
                    <span className="badge badge-datasec">{ev.category}</span>
                    <span className="font-mono">{fmtTs(ev.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
