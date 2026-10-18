import { assets } from './assets.mjs';
const PREFIX = '/ai-hub/';
const securityHeaders = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cache-Control': 'public, no-transform, max-age=120, must-revalidate',
};
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(PREFIX)) return new Response('Not found', {status:404, headers:securityHeaders});
    if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed', {status:405, headers:{...securityHeaders,Allow:'GET, HEAD'}});
    const pathname=url.pathname.slice(PREFIX.length);
    const pages=['tools','design','guides','start','community','toolbox','workshop','videos','feedback'];
    if(pages.includes(pathname)) { url.pathname+='/'; return Response.redirect(url.href,308); }
    const name = !pathname ? 'index.html' : pathname.endsWith('/') ? pathname+'index.html' : pathname;
    const asset = Object.hasOwn(assets, name) ? assets[name] : null;
    if (!asset) return new Response('Not found', {status:404, headers:securityHeaders});
    return new Response(request.method === 'HEAD' ? null : asset.body, {headers:{...securityHeaders,'Content-Type':asset.type}});
  }
};
