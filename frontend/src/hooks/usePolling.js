import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

export function usePolling(path, intervalMs = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const cancelledRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!cancelledRef.current) {
        setData(json);
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, [path]);

  useEffect(() => {
    cancelledRef.current = false;

    fetchData();
    intervalRef.current = setInterval(fetchData, intervalMs);

    return () => {
      cancelledRef.current = true;
      clearInterval(intervalRef.current);
    };
  }, [path, intervalMs, fetchData]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}
