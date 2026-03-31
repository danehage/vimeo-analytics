import { V } from '../../constants/theme';
import StatCard from '../shared/StatCard';
import EnterpriseStatCard from '../shared/EnterpriseStatCard';
import RetentionChart from './RetentionChart';
import EventBreakdown from './EventBreakdown';
import ErrorMessage from '../shared/ErrorMessage';
import { usePolling } from '../../hooks/usePolling';

export default function OverviewTab() {
  const { data, error, refetch } = usePolling('/api/analytics/summary');

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  const views = data?.total_views ?? '—';
  const uniqueViewers = data?.unique_viewers ?? '—';
  const totalMins = data?.total_watch_mins ? `${Math.floor(data.total_watch_mins / 60)}:${String(Math.floor(data.total_watch_mins % 60)).padStart(2, '0')}` : '—';
  const avgPct = data?.avg_percent_watched ? `${Math.round(data.avg_percent_watched)}%` : '—';
  const captionAdoption = data?.caption_adoption ? `${Math.round(data.caption_adoption)}%` : '—';
  const seekEvents = data?.seek_events?.toLocaleString() ?? '—';
  const bufferRate = data?.buffer_rate ? `${Math.round(data.buffer_rate * 10) / 10}%` : '—';
  const qualityChanges = data?.quality_changes?.toLocaleString() ?? '—';

  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: V.textLight, marginBottom: 10 }}>Standard metrics</div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <StatCard label="Views" value={views.toLocaleString ? views.toLocaleString() : views} />
          <StatCard label="Unique viewers" value={uniqueViewers.toLocaleString ? uniqueViewers.toLocaleString() : uniqueViewers} />
          <StatCard label="Total time watched" value={totalMins} />
          <StatCard label="Avg. % watched" value={avgPct} />
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: V.teal, marginBottom: 10 }}>Deep analytics — new</div>
        <div style={{ display: "flex", gap: 12 }}>
          <EnterpriseStatCard label="Caption adoption" value={captionAdoption} sub="of sessions" accent={V.teal} isNew />
          <EnterpriseStatCard label="Seek events" value={seekEvents} sub="scrubs & replays" accent={V.purple} isNew />
          <EnterpriseStatCard label="High buffer sessions" value={bufferRate} sub="sessions >3% buffer" accent={V.red} isNew />
          <EnterpriseStatCard label="Quality changes" value={qualityChanges} sub="manual switches" accent={V.amber} isNew />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <RetentionChart />
        <EventBreakdown />
      </div>
    </>
  );
}
