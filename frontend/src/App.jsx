import { useState, useEffect, useCallback, useRef } from 'react';
import { V } from './constants/theme';
import TopNav from './components/layout/TopNav';
import Sidebar from './components/layout/Sidebar';
import TabBar from './components/layout/TabBar';
import StatCard from './components/shared/StatCard';
import OverviewTab from './components/overview/OverviewTab';
import VideoTable from './components/videos/VideoTable';
import VideoDetail from './components/videos/VideoDetail';
import SessionList from './components/sessions/SessionList';
import SessionDetail from './components/sessions/SessionDetail';
import ViewerList from './components/viewers/ViewerList';
import ViewerDetail from './components/viewers/ViewerDetail';
import EventFeed from './components/EventFeed';
import LiveEventsTab from './components/live/LiveEventsTab';

// Import all 4 engagement sub-components
import SeekHeatmap from './components/engagement/SeekHeatmap';
import CaptionAdoption from './components/engagement/CaptionAdoption';
import QualityDistribution from './components/engagement/QualityDistribution';
import BufferRates from './components/engagement/BufferRates';
import CaptionLanguages from './components/engagement/CaptionLanguages';

// --- Hash-based routing ---
const VALID_TABS = ["overview", "videos", "sessions", "viewers", "engagement", "live-events"];

function buildHash(nav, tab, sessionId, viewerFp, videoId) {
  if (nav !== "deep") return "#/dashboard";
  if (sessionId) return `#/deep/sessions/${sessionId}`;
  if (viewerFp) return `#/deep/viewers/${viewerFp}`;
  if (videoId) return `#/deep/videos/${videoId}`;
  return `#/deep/${tab || "viewers"}`;
}

function parseHash(hash) {
  const path = hash.replace(/^#\/?/, "");
  const parts = path.split("/").filter(Boolean);

  if (!parts.length || parts[0] === "dashboard") {
    return { nav: "dashboard", tab: "viewers", sessionId: null, viewerFp: null, videoId: null };
  }
  if (parts[0] === "deep") {
    const tab = parts[1] || "viewers";
    if (tab === "sessions" && parts[2]) {
      return { nav: "deep", tab: "sessions", sessionId: parts[2], viewerFp: null, videoId: null };
    }
    if (tab === "viewers" && parts[2]) {
      return { nav: "deep", tab: "viewers", sessionId: null, viewerFp: parts[2], videoId: null };
    }
    if (tab === "videos" && parts[2]) {
      return { nav: "deep", tab: "videos", sessionId: null, viewerFp: null, videoId: parts[2] };
    }
    return { nav: "deep", tab: VALID_TABS.includes(tab) ? tab : "viewers", sessionId: null, viewerFp: null, videoId: null };
  }
  return { nav: "deep", tab: "viewers", sessionId: null, viewerFp: null, videoId: null };
}

export default function App() {
  const initial = parseHash(window.location.hash);
  const [activeNav, setActiveNav] = useState(initial.nav);
  const [activeTab, setActiveTab] = useState(initial.tab);
  const [selectedSession, setSelectedSession] = useState(
    initial.sessionId ? { session_id: initial.sessionId, shortId: '#' + initial.sessionId.slice(0, 6) } : null
  );
  const [selectedViewer, setSelectedViewer] = useState(
    initial.viewerFp ? { fingerprintId: initial.viewerFp, status: "unknown" } : null
  );
  const [selectedVideo, setSelectedVideo] = useState(
    initial.videoId ? { video_id: initial.videoId } : null
  );

  // Suppress pushState when handling popstate
  const skipPush = useRef(false);
  const isInitial = useRef(true);

  // Push hash on state change
  useEffect(() => {
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    const newHash = buildHash(
      activeNav,
      activeTab,
      selectedSession?.session_id || null,
      selectedViewer?.fingerprintId || null,
      selectedVideo?.video_id || null,
    );
    if (window.location.hash !== newHash) {
      if (isInitial.current) {
        window.history.replaceState(null, "", newHash);
      } else {
        window.history.pushState(null, "", newHash);
      }
    }
    isInitial.current = false;
  }, [activeNav, activeTab, selectedSession, selectedViewer, selectedVideo]);

  // Listen to popstate (back/forward)
  useEffect(() => {
    const onPop = () => {
      const state = parseHash(window.location.hash);
      skipPush.current = true;
      setActiveNav(state.nav);
      setActiveTab(state.tab);
      setSelectedSession(
        state.sessionId ? { session_id: state.sessionId, shortId: '#' + state.sessionId.slice(0, 6) } : null
      );
      setSelectedViewer(
        state.viewerFp ? { fingerprintId: state.viewerFp, status: "unknown" } : null
      );
      setSelectedVideo(
        state.videoId ? { video_id: state.videoId } : null
      );
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleNavChange = (id) => {
    setActiveNav(id);
    setSelectedSession(null);
    setSelectedViewer(null);
    setSelectedVideo(null);
  };

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSelectedSession(null);
    setSelectedViewer(null);
    setSelectedVideo(null);
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

              {activeTab === "videos" && (
                selectedVideo
                  ? <VideoDetail video={selectedVideo} onBack={() => setSelectedVideo(null)} onSelectSession={(s) => { setSelectedVideo(null); setActiveTab("sessions"); setSelectedSession(s); }} />
                  : <VideoTable onSelect={setSelectedVideo} />
              )}

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

              {activeTab === "live-events" && (
                <LiveEventsTab onSelectSession={(s) => { setActiveTab("sessions"); setSelectedSession(s); }} />
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
