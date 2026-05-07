import { useEvents } from '../hooks/useEvents';
import FilterBar from '../components/FilterBar';
import EventTable from '../components/EventTable';
import { PrimaryButton, StateBlock } from '../components/ProductPrimitives';

export default function EventList() {
  const { data, loading, error, filters, setFilters, refetch } = useEvents();

  return (
    <div className="space-y-lg">
      <div className="mb-6 flex flex-col gap-4 border-b border-outline-variant/10 pb-lg lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-1 inline-flex items-center gap-xs rounded-full bg-primary/10 px-sm py-xs text-label-xs font-label-xs text-primary uppercase tracking-wider">
            EVENTS
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight">Event Query</h1>
            <span className="inline-flex items-center gap-xs rounded-full bg-primary/10 px-sm py-xs text-label-xs font-label-xs text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              LIVE FEED
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-body-sm text-on-surface-variant">Use this for historical queries and issue tracing; prefer the review workbench for daily processing.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-sm">
          <PrimaryButton href="/review">Go to Review Workbench</PrimaryButton>
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />
      {error && <StateBlock tone="error" title="Event load failed" description={error} action={<PrimaryButton icon="refresh" onClick={refetch}>Retry</PrimaryButton>} />}
      {loading && !data && <StateBlock tone="loading" title="Loading events" description="Syncing event list and evidence thumbnails." />}
      {data && data.items.length === 0 && !error && !loading && (
        <StateBlock
          title="No matching events"
          description={filters.status ? 'Next: clear filters, or go back to setup to generate test events.' : 'Next: complete device onboarding first, then generate test events from Android.'}
          action={<PrimaryButton href={filters.status ? '/events' : '/setup'}>{filters.status ? 'Clear Filters' : 'Open Setup Guide'}</PrimaryButton>}
        />
      )}
      {data && data.items.length > 0 && (
        <EventTable
          items={data.items}
          total={data.total}
          offset={parseInt(filters.offset || '0')}
          limit={parseInt(filters.limit || '50')}
          onPage={(newOffset) => setFilters({ ...filters, offset: String(newOffset) })}
        />
      )}
    </div>
  );
}
