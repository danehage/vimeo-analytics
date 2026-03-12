import { useState } from 'react';
import { V } from './constants/theme';
import TopNav from './components/layout/TopNav';
import Sidebar from './components/layout/Sidebar';
import TabBar from './components/layout/TabBar';
import StatCard from './components/shared/StatCard';
import OverviewTab from './components/overview/OverviewTab';
import VideoTable from './components/videos/VideoTable';
import SessionList from './components/sessions/SessionList';
import SessionDetail from './components/sessions/SessionDetail';
import ViewerList from './components/viewers/ViewerList';
import ViewerDetail from './components/viewers/ViewerDetail';
import EventFeed from './components/EventFeed';

// Import all 4 engagement sub-components
import SeekHeatmap from './components/engagement/SeekHeatmap';
import CaptionAdoption from './components/engagement/CaptionAdoption';
import QualityDistribution from './components/engagement/QualityDistribution';
import BufferRates from './components/engagement/BufferRates';
import CaptionLanguages from './components/engagement/CaptionLanguages';

export default function App() {
  const [activeNav, setActiveNav] = useState("deep");
  const [activeTab, setActiveTab] = useState("viewers");
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedViewer, setSelectedViewer] = useState(null);

  const handleNavChange = (id) => {
    setActiveNav(id);
    setSelectedSession(null);
    setSelectedViewer(null);
  };

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSelectedSession(null);
    setSelectedViewer(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Aktiv Grotesk', 'Nunito Sans', 'DM Sans', -apple-system, sans-serif", background: V.bg }}>
      <TopNav />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar activeNav={activeNav} onNavChange={handleNavChange} />
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>

          {/* Standard Dashboard */}
          {activeNav !== "deep" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: V.text, margin: 0 }}>Dashboard</h1>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <StatCard label="Views" value="20" />
                <StatCard label="Unique viewers" value="5" />
                <StatCard label="Total time watched" value="10:00" />
              </div>
              <div style={{ background: V.tealLight, border: `1px solid ${V.tealMid}`, borderRadius: V.cardRadius, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: V.text, marginBottom: 2 }}>Deep Analytics now available</div>
                  <div style={{ fontSize: 12, color: V.textMuted }}>See caption adoption, seek heatmaps, buffer events, and individual session replays.</div>
                </div>
                <div onClick={() => handleNavChange("deep")} style={{ background: V.teal, color: "#0e1216", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                  View Deep Analytics →
                </div>
              </div>
            </div>
          )}

          {/* Deep Analytics */}
          {activeNav === "deep" && (
            <div>
              {/* Page header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: V.text, margin: 0 }}>Deep Analytics</h1>
                    <span style={{ background: V.teal, color: "#0e1216", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.5 }}>ENTERPRISE</span>
                  </div>
                  <div style={{ fontSize: 13, color: V.textMuted }}>Player event telemetry from embedded players and vimeo.com views</div>
                </div>
                <div style={{ background: V.tableHeaderBg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "6px 12px", fontSize: 13, color: V.textMid, cursor: "pointer" }}>
                  All time ▾
                </div>
              </div>

              <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

              {activeTab === "overview" && <OverviewTab />}

              {activeTab === "videos" && <VideoTable />}

              {activeTab === "sessions" && (
                selectedSession
                  ? <SessionDetail session={selectedSession} onBack={() => setSelectedSession(null)} />
                  : <SessionList onSelect={setSelectedSession} />
              )}

              {activeTab === "viewers" && (
                selectedViewer
                  ? <ViewerDetail viewer={selectedViewer} onBack={() => setSelectedViewer(null)} onSelectSession={(s) => { setSelectedViewer(null); setActiveTab("sessions"); setSelectedSession(s); }} />
                  : <ViewerList onSelect={setSelectedViewer} />
              )}

              {activeTab === "engagement" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <SeekHeatmap />
                  <CaptionAdoption />
                  <QualityDistribution />
                  <CaptionLanguages />
                  <BufferRates />
                </div>
              )}

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${V.border}`, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: V.textLight }}>Player event data via Vimeo's embedded tracking · vimeo.com views included for opted-in accounts</span>
                <span style={{ fontSize: 11, color: V.teal, cursor: "pointer", fontWeight: 500 }}>Export raw event data →</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <EventFeed />
    </div>
  );
}
