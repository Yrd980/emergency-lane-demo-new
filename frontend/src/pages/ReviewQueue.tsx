import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useRole } from '../access/useRole';
import { api } from '../api/client';
import EventTable from '../components/EventTable';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import { useEvents } from '../hooks/useEvents';
import { usePolling } from '../hooks/usePolling';
import type { OverviewStats } from '../types';

export default function ReviewQueue() {
  const navigate = useNavigate();
  const { role } = useRole();
  const { data, loading, error, filters, setFilters, refetch } = useEvents({ status: 'pending', limit: '50', offset: '0' });
  const overview = usePolling<OverviewStats>(() => api.getStats(), 5000);
  const firstEvent = data?.items[0];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<'confirmed' | 'rejected' | null>(null);
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const pendingIds = useMemo(() => data?.items.filter((item) => item.review_status === 'pending').map((item) => item.event_id) ?? [], [data]);

  const toggleSelect = (eventId: string) => {
    setBulkMessage(null);
    setSelectedIds((current) => current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId]);
  };

  const toggleSelectAll = () => {
    setBulkMessage(null);
    const selected = new Set(selectedIds);
    const allSelected = pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));
    setSelectedIds(allSelected ? selectedIds.filter((id) => !pendingIds.includes(id)) : Array.from(new Set([...selectedIds, ...pendingIds])));
  };

  const submitBulkReview = async (reviewStatus: 'confirmed' | 'rejected') => {
    if (selectedIds.length === 0) {
      setBulkMessage('Select pending events first, then execute bulk review.');
      return;
    }
    if (bulkStatus !== reviewStatus) {
      setBulkStatus(reviewStatus);
      setBulkMessage(`Will bulk ${reviewStatus === 'confirmed' ? 'confirm' : 'reject'} ${selectedIds.length} events. Click again to execute.`);
      return;
    }
    setSubmittingBulk(true);
    try {
      const result = await api.bulkReviewEvents(
        selectedIds,
        reviewStatus,
        reviewStatus === 'confirmed' ? 'Bulk confirm' : 'Bulk reject',
        role === 'reviewer' ? 'Local Reviewer' : 'Review Manager',
      );
      setBulkMessage(`Processed ${result.updated_count} events.`);
      setSelectedIds([]);
      setBulkStatus(null);
      await refetch();
      await overview.refetch();
    } catch (e: unknown) {
      setBulkMessage((e as Error).message);
    } finally {
      setSubmittingBulk(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="REVIEW"
        title="Review Workbench"
        description="Process the pending review queue as a work queue. Handle high-priority first, then proceed to the next."
        action={
          firstEvent ? (
            <PrimaryButton icon="clipboard_check" href={`/events/${firstEvent.event_id}`}>Process Next</PrimaryButton>
          ) : (
            <PrimaryButton href="/events">View History</PrimaryButton>
          )
        }
      />

      <div className="mb-5">
        <ActionPanel
          title={firstEvent ? 'Next: Open first queued event' : 'No pending review events'}
          description={firstEvent ? `Queue sorted by priority: ${firstEvent.review_priority_reason ?? 'chronological'}, detail page only advances through pending items.` : 'Wait for new events or check history.'}
          tone={firstEvent ? 'warning' : 'success'}
          action={firstEvent ? <PrimaryButton href={`/events/${firstEvent.event_id}`}>Start Review</PrimaryButton> : <PrimaryButton href="/">Back to Workbench</PrimaryButton>}
        />
      </div>

      {overview.data && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <MetricTile label="Pending Review" value={overview.data.pending_review_count} tone="warning" />
          <MetricTile label="Confirmed" value={overview.data.confirmed_count} tone="success" />
          <MetricTile label="Rejected" value={overview.data.rejected_count} tone="danger" />
        </div>
      )}

      {error && (
        <StateBlock tone="error" title="Review queue failed to load" description={error} action={<PrimaryButton icon="refresh" onClick={refetch}>Retry</PrimaryButton>} />
      )}
      {loading && !data && <StateBlock tone="loading" title="Loading review queue" description="Fetching pending events." />}
      {data && data.items.length === 0 && !error && !loading && (
        <StateBlock
          tone="success"
          title="Review queue clear"
          description="Return to workbench to check device health, or wait for new events from Android."
          action={<PrimaryButton href="/">Back to Workbench</PrimaryButton>}
        />
      )}
      {data && data.items.length > 0 && (
        <>
          {/* Bulk Actions Bar */}
          <SurfacePanel className="mb-3 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">Bulk Review</div>
                <div className="mt-1 text-xs text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)]/10 px-2 py-0.5 text-[var(--brand)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-soft)]" />
                    {selectedIds.length} selected
                  </span>
                  {' '}pending items from current queue.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-glow)] disabled:opacity-50 transition-all"
                  disabled={submittingBulk}
                  onClick={toggleSelectAll}
                >
                  Select Page
                </button>
                <PrimaryButton icon="check_circle" disabled={submittingBulk || selectedIds.length === 0} onClick={() => submitBulkReview('confirmed')}>
                  {bulkStatus === 'confirmed' ? 'Click to Confirm' : 'Bulk Confirm'}
                </PrimaryButton>
                <PrimaryButton tone="danger" icon="cancel" disabled={submittingBulk || selectedIds.length === 0} onClick={() => submitBulkReview('rejected')}>
                  {bulkStatus === 'rejected' ? 'Click to Reject' : 'Bulk Reject'}
                </PrimaryButton>
              </div>
            </div>
            {bulkMessage && (
              <div className="mt-3 rounded-lg bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)] border border-[var(--line)]/10">
                {bulkMessage}
              </div>
            )}
          </SurfacePanel>

          <EventTable
            items={data.items}
            total={data.total}
            offset={parseInt(filters.offset || '0')}
            limit={parseInt(filters.limit || '50')}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onPage={(newOffset) => {
              setSelectedIds([]);
              setFilters({ ...filters, offset: String(newOffset) });
              navigate('/review');
            }}
          />
        </>
      )}
    </div>
  );
}
