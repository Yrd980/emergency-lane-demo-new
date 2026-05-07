import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAuth } from '../access/useRole';
import { api } from '../api/client';
import EventTable from '../components/EventTable';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import { useEvents } from '../hooks/useEvents';
import { usePolling } from '../hooks/usePolling';
import type { OverviewStats } from '../types';

export default function ReviewQueue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, filters, setFilters, refetch } = useEvents({ status: 'pending', sort: 'review_priority', limit: '50', offset: '0' });
  const overview = usePolling<OverviewStats>(() => api.getStats(), 5000);
  const firstEvent = data?.items[0];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<'validated' | 'false_alarm' | null>(null);
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

  const submitBulkReview = async (reviewStatus: 'validated' | 'false_alarm') => {
    if (selectedIds.length === 0) {
      setBulkMessage('Select pending events first, then choose a review outcome.');
      return;
    }
    if (bulkStatus !== reviewStatus) {
      setBulkStatus(reviewStatus);
      setBulkMessage(
        reviewStatus === 'validated'
          ? `Confirm ${selectedIds.length} selected incidents as validated. Bulk confirmation requires complete before, peak, and after evidence. Click again to apply.`
          : `Mark ${selectedIds.length} selected incidents as false alarms. Click again to apply.`,
      );
      return;
    }
    setSubmittingBulk(true);
    try {
      const result = await api.bulkReviewEvents(
        selectedIds,
        reviewStatus,
        reviewStatus === 'validated' ? 'Bulk validate' : 'Bulk false alarm',
        user?.display_name ?? 'Aegis Reviewer',
      );
      const failedCount = result.failed_event_ids?.length ?? 0;
      const missingCount = result.missing_event_ids.length;
      setBulkMessage(
        failedCount || missingCount
          ? `Processed ${result.updated_count} events. ${failedCount} blocked by evidence or status policy, ${missingCount} missing.`
          : `Processed ${result.updated_count} events.`,
      );
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
    <div className="space-y-lg">
      <PageHeader
        eyebrow="REVIEW"
        title="Review Workbench"
        description="Process the pending review queue as a work queue. Handle high-priority first, then proceed to the next."
        action={
          firstEvent ? (
            <PrimaryButton icon="fact_check" href={`/events/${firstEvent.event_id}?from=review`}>Process Next</PrimaryButton>
          ) : (
            <PrimaryButton href="/events">View History</PrimaryButton>
          )
        }
      />

      <div>
        <ActionPanel
          title={firstEvent ? 'Next: Open first queued event' : 'No pending review events'}
          description={firstEvent ? `Queue sorted by priority: ${firstEvent.review_priority_reason ?? 'chronological'}, detail page only advances through pending items.` : 'Wait for new events or check history.'}
          tone={firstEvent ? 'warning' : 'success'}
          action={firstEvent ? <PrimaryButton href={`/events/${firstEvent.event_id}?from=review`}>Start Review</PrimaryButton> : <PrimaryButton href="/">Back to Workbench</PrimaryButton>}
        />
      </div>

      {overview.data && (
        <div className="mb-lg grid gap-4 sm:grid-cols-3">
          <MetricTile label="Pending Review" value={overview.data.pending_review_count} tone="warning" />
          <MetricTile label="Validated" value={overview.data.confirmed_count} tone="success" />
          <MetricTile label="False Alarm" value={overview.data.rejected_count} tone="danger" />
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
          <SurfacePanel className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-body-sm font-semibold text-on-surface">Selected Review Outcome</div>
                <div className="mt-1 text-label-xs text-on-surface-variant">
                  <span className="inline-flex items-center gap-xs rounded-full bg-primary/10 px-sm py-xs text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {selectedIds.length} selected
                  </span>
                  {' '}pending items from current queue.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-sm rounded-lg border border-outline-variant/50 bg-surface-container-high px-3 py-2 text-body-sm font-semibold text-on-surface transition-all hover:bg-surface-container-highest disabled:opacity-50"
                  disabled={submittingBulk}
                  onClick={toggleSelectAll}
                >
                  Select Page
                </button>
                <PrimaryButton tone="light" icon="check_circle" disabled={submittingBulk || selectedIds.length === 0} onClick={() => submitBulkReview('validated')}>
                  {bulkStatus === 'validated' ? 'Apply Confirmation' : 'Confirm Selected'}
                </PrimaryButton>
                <PrimaryButton tone="danger" icon="cancel" disabled={submittingBulk || selectedIds.length === 0} onClick={() => submitBulkReview('false_alarm')}>
                  {bulkStatus === 'false_alarm' ? 'Apply False Alarm' : 'Mark False Alarm'}
                </PrimaryButton>
              </div>
            </div>
            {bulkMessage && (
              <div className="mt-3 rounded-lg bg-surface-container px-3 py-2 text-body-sm text-on-surface-variant border border-outline-variant/10">
                {bulkMessage}
              </div>
            )}
          </SurfacePanel>

          <EventTable
            mode="review"
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
