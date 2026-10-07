// Seed sessions in seed.sql use IDs ending in -0000000000NN; everything else
// was captured by the collector from a real player.
export const isLiveSession = (sessionId) => !!sessionId && !/-0{10}\d{2}$/.test(sessionId);
