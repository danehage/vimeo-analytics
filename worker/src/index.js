import { neon } from '@neondatabase/serverless';
import { handleEvents, handleIdentify } from './routes/events.js';
import { handleAnalytics } from './routes/analytics.js';

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.CORS_ORIGINS || '').split(',').map(s => s.trim());
  const isAllowed = allowed.includes(origin) || allowed.includes('*');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowed[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const sql = neon(env.DATABASE_URL);

    try {
      let response;

      if (request.method === 'POST' && path === '/api/events') {
        response = await handleEvents(request, sql);
      } else if (request.method === 'POST' && path === '/api/identify') {
        response = await handleIdentify(request, sql);
      } else if (request.method === 'GET' && path.startsWith('/api/analytics')) {
        response = await handleAnalytics(path, url.searchParams, sql);
      } else {
        response = new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
      }

      // Apply CORS headers
      const headers = new Headers(response.headers);
      Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
      headers.set('Content-Type', 'application/json');

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    } catch (err) {
      console.error('Worker error:', err.message, err.stack);
      return new Response(JSON.stringify({ error: 'Internal server error', detail: err.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  },
};
