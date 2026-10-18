import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const path=resolve(root,'source/template.html');
let html=await readFile(path,'utf8');
if(html.includes('<!-- GUIDES:START -->')){
  const data=JSON.parse(await readFile(resolve(root,'data/guides.json'),'utf8'));
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const topics={tools:'工具与模型',subscription:'订阅与权益','api-cost':'API 与成本',agent:'Agent 工作流',creation:'创作与设计',cloud:'云资源与部署'};
  if(data.cards.some(card=>!Object.hasOwn(topics,card.topic)||card.id.startsWith('b')))throw Error('Private or unknown card category in public data.');
  const cards=data.cards.map(c=>`<details class="knowledge-card" id="card-${esc(c.id)}" data-card="${esc(c.id)}" data-guide-topic="${esc(c.topic)}" data-guide-search="${esc([c.title,topics[c.topic],...c.body].join(' '))}">
<summary><span class="guide-category">${esc(topics[c.topic])} · ${esc(c.id.toUpperCase())}</span><h3>${esc(c.title)}</h3><span class="guide-expand" aria-hidden="true">＋</span></summary>
<div class="guide-body">${c.body.map(p=>`<p>${esc(p)}</p>`).join('')}
<p class="guide-verification">${esc(c.verification.status)} · 来源整理于 <time datetime="${esc(c.verification.checked_on)}">${esc(c.verification.checked_on)}</time></p>
<div class="guide-links"><a href="${esc(c.source_url)}" target="_blank" rel="noopener noreferrer">公开来源页 ↗</a>${c.links.map((u,i)=>`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">原资料线索 ${i+1} ↗</a>`).join('')}</div>
<a class="guide-permalink" href="?card=${esc(c.id)}#guides">此卡固定入口 ↗</a></div></details>`).join('\n');
  const section=`<section class="wrap section guides-section" id="guides" aria-labelledby="guides-title">
<div class="section-heading"><div><p class="eyebrow">READ WHEN YOU NEED IT</p><h2 id="guides-title">实践资料，按问题阅读</h2></div><span class="pill">公开专题 ${data.public_inventory_count} 张 · 已载入 ${data.loaded_body_count} 张正文</span></div>
<p class="section-intro">这里保留资料的历史条件与验证边界。先找问题，再展开正文；旧价格、旧权益与个别体验需要回到原站核对。</p>
<div class="guide-controls"><label class="search-field"><span aria-hidden="true">⌕</span><span class="sr-only">搜索知识卡</span><input id="guide-search" type="search" placeholder="搜索问题或正文，如：预算、交接、批量生图…" autocomplete="off"></label><label class="site-select">按知识专题<select id="guide-topic"><option value="all">全部知识专题</option>${Object.entries(topics).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label></div>
<div class="site-focus" id="guide-focus" hidden><span id="guide-focus-name"></span><button type="button" id="clear-guide">查看全部知识卡 →</button></div>
<div class="site-results"><p id="guide-result-count" role="status">显示 ${data.loaded_body_count} / ${data.loaded_body_count} 张知识卡</p><button type="button" id="reset-guides">清除知识卡筛选</button></div>
<div class="guide-grid">${cards}</div><div class="empty-state" id="guide-empty" hidden><strong>没有匹配的知识卡</strong><p>可以换一个关键词，或清除筛选。</p><button type="button" id="empty-reset-guides">显示全部知识卡</button></div>
</section>`;
  html=html.replace(/<!-- GUIDES:START -->[\s\S]*?<!-- GUIDES:END -->/,`<!-- GUIDES:START -->\n${section}\n<!-- GUIDES:END -->`);
  await writeFile(path,html);
}
