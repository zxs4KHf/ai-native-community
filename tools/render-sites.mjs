import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const htmlPath=resolve(root,'source/template.html');
let html=await readFile(htmlPath,'utf8');
if(html.includes('<!-- SITES:START -->')) {
  const data=JSON.parse(await readFile(resolve(root,'data/sites.json'),'utf8'));
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const topics={tools:'06 工具与模型',subscription:'02 订阅与权益','api-cost':'05 API 与成本',agent:'01 Agent 工作流',creation:'07 创作与设计',cloud:'08 云资源与部署'};
  const categories=new Map(data.categories.map(c=>[c.id,c.label]));
  const options=data.categories.map(c=>`<option value="${esc(c.id)}">${esc(c.label)}（${c.count}）</option>`).join('');
  const topicOptions=Object.entries(topics).map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
  const cards=data.entries.map(entry=>{
    const ref=entry.referral;
    const identityClass=entry.identity.startsWith('第三方')?'third-party':entry.identity.includes('官方')?'official':'community';
    return `<article class="site-card" id="site-${esc(entry.id)}" data-site="${esc(entry.id)}" data-category="${esc(entry.category)}" data-origin="${identityClass}" data-name="${esc(entry.name)}" data-verified="${esc(entry.verification.checked_on)}" data-topics="${esc(entry.topics.join(' '))}" data-search="${esc([entry.name,entry.identity,categories.get(entry.category),entry.purpose,...entry.tags].join(' '))}">
<div class="site-card-head"><span class="site-category">${esc(categories.get(entry.category))}</span><span class="identity ${identityClass}">${esc(entry.identity)}</span></div>
<h3>${esc(entry.name)}</h3><p class="site-purpose">${esc(entry.purpose)}</p>
<div class="site-tags">${entry.tags.map(tag=>`<span>${esc(tag)}</span>`).join('')}</div>
<details class="site-extra"><summary>核验与相关资料 <span aria-hidden="true">＋</span></summary><div>
<div class="site-related">相关专题：${entry.topics.map(topic=>`<a href="?topic=${topic}#atlas">${topics[topic]}</a>`).join(' · ')}</div>
<div class="site-verification"><span>${esc(entry.verification.status)}</span><time datetime="${esc(entry.verification.checked_on)}">${esc(entry.verification.checked_on)}</time><a href="${esc(entry.verification.source_url)}" target="_blank" rel="noopener noreferrer" aria-label="查看${esc(entry.name)}的公开核验来源">来源 ↗</a></div>
</div></details>
${entry.caution?`<p class="site-caution">${esc(entry.caution)}</p>`:''}
<div class="site-actions"><a class="site-official" href="${esc(entry.url)}" target="_blank" rel="noopener noreferrer" aria-label="官网：${esc(entry.name)}">官网 ↗</a>${ref?`<a class="site-invite" href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer sponsored" aria-describedby="referral-${esc(entry.id)}">本人邀请链接 ↗</a>`:''}</div>
${ref?`<p class="referral-disclosure" id="referral-${esc(entry.id)}"><strong>${esc(ref.ownership)}</strong> · ${esc(ref.disclosure)}</p>`:''}
<a class="site-permalink" href="?site=${esc(entry.id)}#sites" aria-label="定位网站：${esc(entry.name)}">定位此网站 ↗</a>
</article>`;
  }).join('\n');
  const section=`<section class="sites-section section" id="sites" aria-labelledby="sites-title"><div class="wrap">
<div class="section-heading"><div><p class="eyebrow">FIND A WEBSITE FOR THE JOB</p><h2 id="sites-title">精选网站，按用途找入口</h2></div><span class="pill">独立收录 ${data.entries.length} 个网站 · 知识卡另行统计</span></div>
<p class="section-intro">从一个明确用途出发，区分官方产品、第三方中转与信息聚合。收录只帮助找到原站，浏览或收藏不构成推荐背书。</p>
<details class="catalog-notes"><summary>怎样理解核验状态与邀请入口？ <span aria-hidden="true">＋</span></summary><div><p>“已核验用途”仅指公开页面所示身份和用途；未验证效果、额度、价格、安全性、模型真实性或稳定性。目录核验日期：${esc(data.prepared_on)}。</p><p>“官网”指该服务自有主页，第三方中转的官网不等于模型厂商官方。本站只展示已核验为本人归属的邀请链接。本人邀请链接，可能获得平台奖励；现金返佣、比例、提现和到账规则均未核验，不承诺折扣或模型真实性。两种入口并列，可自行选择。</p><p>第三方模型行为探针只能辅助比较，不能证明模型真实身份。不要向此类工具提交生产 API 密钥或敏感数据。</p><p>搜索文本只在浏览器内处理，不保存、不写入网址。分类、专题和单站定位使用固定公开标识，可复制当前网址分享。</p></div></details>
<div class="site-controls"><label class="search-field"><span aria-hidden="true">⌕</span><span class="sr-only">搜索精选网站</span><input id="site-search" type="search" placeholder="搜索网站、用途或标签，如：文档、编程、API…" autocomplete="off"></label><label class="site-select">按用途<select id="site-category"><option value="all">全部用途（${data.entries.length}）</option>${options}</select></label><label class="site-select">对应知识专题<select id="site-topic"><option value="all">全部专题</option>${topicOptions}</select></label><label class="site-select">服务身份<select id="site-origin"><option value="all">全部身份</option><option value="official">官方产品与资源</option><option value="third-party">第三方服务</option><option value="community">社区与其他资源</option></select></label><label class="site-select">排序<select id="site-sort"><option value="directory">目录顺序</option><option value="name">按名称</option><option value="category">按用途分类</option><option value="verified">按核验日期</option></select></label></div>
<div class="site-focus" id="site-focus" hidden><span id="site-focus-name"></span><button type="button" id="clear-site">查看全部网站 →</button></div>
<div class="site-results"><p id="site-result-count" role="status">显示 ${data.entries.length} / ${data.entries.length} 个网站</p><button type="button" id="reset-sites">清除网站筛选</button></div>
<div class="site-grid" id="site-grid">${cards}</div>
<div class="empty-state" id="site-empty" hidden><strong>没有匹配的网站</strong><p>可以换一个关键词、选择其他用途，或清除筛选。</p><button type="button" id="empty-reset-sites">显示全部网站</button></div>
<p class="catalog-footer">来源：授权整理的公开目录 · ${data.entries.length} 个网站单独统计。目录不包含原始浏览记录、个人查询内容或私有核验材料。<a href="#sources">阅读来源与边界 ↑</a></p>
</div></section>`;
  const sidebar=`<p class="sidebar-kicker">EXPLORE THE INDEX</p><h2>按用途浏览</h2><nav aria-label="用途分类"><a href="./#sites" data-category-link="all"><span>全部网站</span><span>${data.entries.length}</span></a>${data.categories.map(c=>`<a href="?siteCategory=${esc(c.id)}#sites" data-category-link="${esc(c.id)}"><span>${esc(c.label)}</span><span>${c.count}</span></a>`).join('')}</nav><div class="sidebar-routes"><h2>需要方法时</h2><a href="#atlas">教程与配置 ↗</a><a href="#start">新手路线 ↗</a><a href="#workshop">提问工作台 ↗</a><a href="#video">视频导读 ↗</a></div><p class="sidebar-note">网站用于发现入口。<br>收录不等于效果背书。</p>`;
  html=html.replace(/<!-- SIDEBAR:START -->[\s\S]*?<!-- SIDEBAR:END -->/,`<!-- SIDEBAR:START -->\n${sidebar}\n<!-- SIDEBAR:END -->`);
  html=html.replace(/<strong data-site-total>\d+<\/strong>/g,`<strong data-site-total>${data.entries.length}</strong>`);
  await writeFile(htmlPath,html.replace(/<!-- SITES:START -->[\s\S]*?<!-- SITES:END -->/,`<!-- SITES:START -->\n${section}\n<!-- SITES:END -->`));
}
