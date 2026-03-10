import { neon } from '@neondatabase/serverless';
import { handleEvents, handleIdentify } from './routes/events.js';
import { handleAnalytics } from './routes/analytics.js';

const COLLECTOR_JS = `(function(){
'use strict';
var C=window.VimeoAnalyticsConfig||{},EP=C.endpoint,S=crypto.randomUUID();
function gfp(){var f=sessionStorage.getItem('vda_fingerprint')||localStorage.getItem('vda_fingerprint');if(!f){var s=[navigator.userAgent,screen.width+'x'+screen.height,screen.colorDepth,Intl.DateTimeFormat().resolvedOptions().timeZone,navigator.platform,navigator.hardwareConcurrency||'unknown',navigator.language].join('|'),h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h=h&h}f='fp_'+Math.abs(h).toString(36)}sessionStorage.setItem('vda_fingerprint',f);localStorage.setItem('vda_fingerprint',f);return f}
var F=gfp(),V=null,D=null,L=0;
function send(t,p){var d={session_id:S,fingerprint_id:F,video_id:V,viewer_id:C.viewerId||null,embed_url:location.href,event_type:t,playhead:p.seconds||0,timestamp:new Date().toISOString(),video_duration:D,payload:p};var b=new Blob([JSON.stringify(d)],{type:'application/json'});navigator.sendBeacon(EP,b)||fetch(EP,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d),keepalive:true}).catch(function(){})}
var iframe=document.querySelector(C.iframeSelector||'iframe[src*="vimeo.com"]');if(!iframe){console.warn('[VDA] No Vimeo iframe found');return}
var player=new Vimeo.Player(iframe);
Promise.all([player.getVideoId(),player.getDuration()]).then(function(r){V=String(r[0]);D=r[1]});
['play','pause','ended','seeked'].forEach(function(e){player.on(e,function(d){send(e,{seconds:d.seconds,duration:d.duration,percent:d.percent})})});
player.on('timeupdate',function(d){if(d.seconds-L>=5){L=d.seconds;send('timeupdate',{seconds:d.seconds,duration:d.duration,percent:d.percent})}});
player.on('qualitychange',function(d){send('qualitychange',{quality:d.quality})});
player.on('texttrackchange',function(d){send('texttrackchange',{kind:d.kind,label:d.label,language:d.language})});
player.on('volumechange',function(d){send('volumechange',{volume:d.volume})});
player.on('bufferstart',function(){player.getCurrentTime().then(function(s){send('bufferstart',{seconds:s})})});
player.on('bufferend',function(){player.getCurrentTime().then(function(s){send('bufferend',{seconds:s})})});
window.addEventListener('beforeunload',function(){player.getCurrentTime().then(function(s){var d={session_id:S,fingerprint_id:F,video_id:V,viewer_id:C.viewerId||null,embed_url:location.href,event_type:'session_end',playhead:s,timestamp:new Date().toISOString(),video_duration:D,payload:{seconds:s}};navigator.sendBeacon(EP,new Blob([JSON.stringify(d)],{type:'application/json'}))})});
})();`;

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.CORS_ORIGINS || '').split(',').map(s => s.trim());
  const isAllowed = allowed.includes(origin) || allowed.includes('*');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowed[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
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
      } else if (request.method === 'GET' && path === '/collector.js') {
        return new Response(COLLECTOR_JS, {
          status: 200,
          headers: { 'Content-Type': 'application/javascript', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
        });
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
