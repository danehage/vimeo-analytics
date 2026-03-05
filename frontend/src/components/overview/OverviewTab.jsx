import { V } from '../../constants/theme';
import StatCard from '../shared/StatCard';
import EnterpriseStatCard from '../shared/EnterpriseStatCard';
import RetentionChart from './RetentionChart';
import EventBreakdown from './EventBreakdown';
import { usePolling } from '../../hooks/usePolling';

export default function OverviewTab() {
  const { data } = usePolling('/api/analytics/summary');
  const summary = data || {
    views: 847,
    uniqueViewers: 312,
    totalTime: "94:12",
    avgPct: "58%",
    captionAdoption: "34%",
    seekEvents: "8,923",
    bufferRate: "3.8%",
    qualityChanges: "1,204",
  };

  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: V.textLight, marginBottom: 10 }}>Standard metrics</div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <StatCard label="Views" value={summary.views?.toLocaleString?.() || summary.views} />
          <StatCard label="Unique viewers" value={summary.uniqueViewers?.toLocaleString?.() || summary.uniqueViewers} />
          <StatCard label="Total time watched" value={summary.totalTime || "94:12"} />
          <StatCard label="Avg. % watched" value={summary.avgPct || "58%"} />
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: V.teal, marginBottom: 10 }}>Deep analytics — new</div>
        <div style={{ display: "flex", gap: 12 }}>
          <EnterpriseStatCard label="Caption adoption" value={summary.captionAdoption || "34%"} sub="of sessions" accent={V.teal} isNew />
          <EnterpriseStatCard label="Seek events" value={summary.seekEvents || "8,923"} sub="scrubs & replays" accent={V.purple} isNew />
          <EnterpriseStatCard label="Buffer incidents" value={summary.bufferRate || "3.8%"} sub="of sessions" accent={V.red} isNew />
          <EnterpriseStatCard label="Quality changes" value={summary.qualityChanges || "1,204"} sub="manual switches" accent={V.amber} isNew />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <RetentionChart />
        <EventBreakdown />
      </div>
    </>
  );
}
