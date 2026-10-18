import assert from 'node:assert/strict';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import worker from '../worker.mjs';
import {assets} from '../assets.mjs';
const root=resolve(import.meta.dirname,'..');
const pages=['','tools/','design/','guides/','start/','community/','toolbox/','workshop/','videos/'];
const expected=pages.map(p=>p+'index.html').concat(['style.css','app.js','icon.svg']).sort();
assert.deepEqual(Object.keys(assets).sort(),expected);
async function list(path,prefix=''){let names=[];for(const item of await readdir(path,{withFileTypes:true})){if(item.isDirectory())names.push(...await list(resolve(path,item.name),prefix+item.name+'/'));else names.push(prefix+item.name);}return names;}
assert.deepEqual((await list(resolve(root,'public'))).sort(),expected);
const texts=Object.fromEntries(await Promise.all(expected.map(async name=>[name,await readFile(resolve(root,'public',name),'utf8')])));
for(const [name,source] of Object.entries(texts)){
 assert.equal(source,assets[name].body);
 assert(!/sk-[A-Za-z0-9_-]{16,}|AIza[\w-]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+[\w.-]{20,}/.test(source),`Secret in ${name}`);
 assert(!/internal-api-drive-stream|authcode\/\?code=|card-b0[1-6]|data-guide-topic="community"|[A-Z]:\\/.test(source),`Private content in ${name}`);
 assert(!/localStorage|sessionStorage|document\.cookie|sendBeacon|fetch\s*\(|XMLHttpRequest|WebSocket/.test(source),`Storage/network in ${name}`);
}
const ids={};
for(const name of expected.filter(n=>n.endsWith('.html'))){
 const html=texts[name];ids[name]=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids[name].length,new Set(ids[name]).size,'Duplicate IDs '+name);
 assert.equal([...html.matchAll(/<h1\b/g)].length,1,'One H1 per page '+name);
 for(const a of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g))assert(a[0].includes('noopener noreferrer'));
}
for(const [name,html] of Object.entries(texts).filter(([n])=>n.endsWith('.html'))){
 for(const match of html.matchAll(/href="([^"]+)"/g)){
  const href=match[1].replaceAll('&amp;','&');if(!href.startsWith('/ai-hub/')&&!href.startsWith('#'))continue;
  const u=new URL(href,'https://local/ai-hub/'+name);
  let resource=u.pathname.slice('/ai-hub/'.length);resource=resource.endsWith('/')?resource+'index.html':resource||'index.html';
  assert(Object.hasOwn(texts,resource),`Broken internal resource ${name}: ${href}`);
  if(u.hash)assert(ids[resource]?.includes(decodeURIComponent(u.hash.slice(1))),`Broken cross-page anchor ${name}: ${href}`);
 }
}
for(const page of pages){
 const r=await worker.fetch(new Request('https://api.190675.xyz/ai-hub/'+page));assert.equal(r.status,200);
 assert(r.headers.get('Content-Security-Policy').includes("connect-src 'none'"));assert(r.headers.get('Cache-Control').includes('no-transform'));
 assert.equal(await(await worker.fetch(new Request('https://api.190675.xyz/ai-hub/'+page,{method:'HEAD'}))).text(),'');
 assert.equal((await worker.fetch(new Request('https://api.190675.xyz/ai-hub/'+page,{method:'POST'}))).status,405);
}
for(const p of ['.env','deployment.json','data/guides.json','source/template.html','tools/cloudflare.py','unknown/'])assert.equal((await worker.fetch(new Request('https://api.190675.xyz/ai-hub/'+p))).status,404);
assert.equal((await worker.fetch(new Request('https://api.190675.xyz/research-workflow/'))).status,404);
assert.equal((await worker.fetch(new Request('https://api.190675.xyz/ai-hub/tools'))).status,308);
assert(!texts['index.html'].includes('id="start"')&&!texts['index.html'].includes('id="guides"')&&!texts['index.html'].includes('id="project"'));
assert(texts['index.html'].includes('AI native 社区'));
const baseline=JSON.parse(await readFile(resolve(root,'fixtures/legacy-anchors.json'),'utf8'));
const allIds=new Set(Object.values(ids).flat());for(const id of baseline.all_ids)assert(allIds.has(id),'Lost legacy ID '+id);
const guides=JSON.parse(await readFile(resolve(root,'data/guides.json'),'utf8'));
assert.equal(guides.cards.length,55);assert.equal(guides.original_inventory_count,61);assert.equal(guides.public_inventory_count,55);
assert(guides.cards.every(c=>['tools','subscription','api-cost','agent','creation','cloud'].includes(c.topic)&&!c.id.startsWith('b')));
for(const c of guides.cards)assert(texts['guides/index.html'].includes('id="card-'+c.id+'"'));
const design=JSON.parse(await readFile(resolve(root,'data/inspiration.json'),'utf8'));assert.equal(design.entries.length,18);assert.equal(design.entries.reduce((n,e)=>n+e.author_evaluation.length,0),101);
assert(!/Godly|Unblast|gavin\.design/.test(texts['design/index.html']));assert(texts['design/index.html'].includes('403'));assert(texts['design/index.html'].includes('screensdesign.com'));
const tools=JSON.parse(await readFile(resolve(root,'data/toolbox.json'),'utf8')).entries;
assert.equal(tools.length,9);assert.deepEqual(tools.filter(t=>t.endorsement==='recommended').map(t=>t.id).sort(),['manictime','pixpin']);
assert(!tools.some(t=>['sharex','idm'].includes(t.id)));assert.equal(tools.find(t=>t.id==='everything').endorsement,'not-rated');assert.equal(tools.find(t=>t.id==='7zip').endorsement,'not-rated');
assert(!/version_note|installed_version|process_id|process_started|AppData|C:\\/.test(JSON.stringify(tools)));
assert(texts['style.css'].includes('@media(prefers-reduced-motion:reduce)'));
const report={status:'passed',checked_at:new Date().toISOString(),independent_pages:pages.length,reviewed_resources:expected.length,original_anchors_retained:baseline.all_ids.length,public_cards:55,private_cards_excluded:6,design_main_sites:18,author_evaluation_characters:101,toolbox_cards:9,user_recommended:['pixpin','manictime'],homepage_contains_no_long_tutorial:true,cross_page_links_passed:true,secret_privacy_scan_passed:true,methods_and_path_isolation_passed:true};
await mkdir(resolve(root,'evidence'),{recursive:true});
await writeFile(resolve(root,'evidence/community-static-checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
