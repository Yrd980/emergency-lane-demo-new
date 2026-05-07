import { useSearchParams } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import FilterBar from '../components/FilterBar';
import EventTable from '../components/EventTable';
import { PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';

export default function EventList() {
  const [searchParams] = useSearchParams();
  const { data, loading, error, filters, setFilters, refetch } = useEvents({
    sort: 'created_desc',
    ...(searchParams.get('roi_id') ? { roi_id: searchParams.get('roi_id') || '' } : {}),
    ...(searchParams.get('status') ? { status: searchParams.get('status') || '' } : {}),
  });

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="EVENTS"
        title="Event Query"
        description="Use historical filters for evidence tracing. Use the review workbench for daily pending decisions."
        action={
          <>
            <span className="inline-flex min-h-11 items-center gap-xs rounded-lg border border-primary/15 bg-primary/10 px-md text-body-sm font-semibold text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Live Feed
            </span>
            <PrimaryButton href="/review">Go to Review Workbench</PrimaryButton>
          </>
        }
      />

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
