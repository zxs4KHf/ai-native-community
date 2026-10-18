'use strict';
(() => {
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const root='/ai-hub/';
  const page=document.body.dataset.page;
  const params=()=>new URLSearchParams(location.search);
  let hash='';try{hash=decodeURIComponent(location.hash.slice(1));}catch{}
  let legacy=LEGACY_ROUTES[hash];
  if(!legacy && page==='home'){
    const p=params();
    if(p.has('site')||p.has('siteCategory')||p.has('siteOrigin')||p.has('siteUsage'))legacy='tools';
    else if(p.has('card')||p.has('topic')||p.has('filter'))legacy='guides';
  }
  if(legacy && !document.getElementById(hash) && !(page===legacy)){
    location.replace(root+(legacy==='home'?'':legacy+'/')+location.search+location.hash);
    return;
  }
  const topics={tools:'工具与模型',subscription:'订阅与权益','api-cost':'API与成本',agent:'Agent工作流',creation:'创作与设计',cloud:'云资源与部署'};
  const groups={start:['tools','subscription','creation'],cost:['subscription','api-cost','cloud'],make:['api-cost','agent','creation','cloud']};
  function update(values,anchor,replace=false){
    const url=new URL(location.href);
    for(const [key,value] of Object.entries(values)){if(value===null||value==='all'||key==='sort'&&value==='frequent')url.searchParams.delete(key);else url.searchParams.set(key,value);}
    if(anchor)url.hash=anchor;
    history[replace?'replaceState':'pushState'](null,'',url);
    hash=url.hash.slice(1);
    render();
  }
  function revealHash(){
    let target;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{}
    if(!target)return;
    for(let node=target;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;
    requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
  }
  const cards=$$('.site-card');
  const allowedCategory=new Set($('#site-category')?[...$('#site-category').options].map(o=>o.value):[]);
  const allowedOrigin=new Set(['all','official','third-party','community']);
  const allowedSort=new Set(['frequent','directory','name','category','verified']);
  function renderSites(){
    if(!cards.length)return;
    const p=params();
    let single=cards.some(c=>c.dataset.site===p.get('site'))?p.get('site'):null;
    if(!single && hash.startsWith('site-')&&cards.some(c=>c.id===hash))single=hash.slice(5);
    const category=single?'all':allowedCategory.has(p.get('siteCategory'))?p.get('siteCategory'):'all';
    const topic=!single&&Object.hasOwn(topics,p.get('topic'))?p.get('topic'):null;
    const origin=single?'all':allowedOrigin.has(p.get('siteOrigin'))?p.get('siteOrigin'):'all';
    const sort=allowedSort.has(p.get('sort'))?p.get('sort'):'frequent';
    const usage=!single&&['frequent','in-use','recommended'].includes(p.get('siteUsage'))?p.get('siteUsage'):'all';
    const query=$('#site-search').value.trim().toLocaleLowerCase();
    const designTag=$('#design-tag')&&[...$('#design-tag').options].some(o=>o.value===p.get('designTag'))?p.get('designTag'):'all';
    let count=0;
    for(const card of cards){
      const matches=(!single||card.dataset.site===single)&&(category==='all'||card.dataset.category===category)&&(!topic||card.dataset.topics.split(' ').includes(topic))&&(origin==='all'||card.dataset.origin===origin)&&(usage==='all'||card.dataset.usage.split(' ').includes(usage))&&(designTag==='all'||(card.dataset.designTags||'').split(' ').includes(designTag))&&card.dataset.search.toLocaleLowerCase().includes(query);
      card.hidden=!matches;if(matches)count++;
    }
    $('#site-category').value=category;$('#site-topic').value=topic||'all';$('#site-origin').value=origin;$('#site-sort').value=sort;$('#site-usage').value=usage;
    if($('#design-tag'))$('#design-tag').value=designTag;
    const ordered=[...cards].sort((a,b)=>Number(a.dataset.directoryOrder)-Number(b.dataset.directoryOrder));
    if(sort==='frequent')ordered.sort((a,b)=>Number(a.dataset.frequentOrder)-Number(b.dataset.frequentOrder));
    if(sort==='name')ordered.sort((a,b)=>a.dataset.name.localeCompare(b.dataset.name,'zh-CN'));
    if(sort==='category')ordered.sort((a,b)=>a.dataset.category.localeCompare(b.dataset.category)||a.dataset.name.localeCompare(b.dataset.name,'zh-CN'));
    if(sort==='verified')ordered.sort((a,b)=>b.dataset.verified.localeCompare(a.dataset.verified));
    $('#site-grid').append(...ordered);
    $('#site-result-count').textContent=`显示 ${count} / ${cards.length} 个网站`;
    $('#site-empty').hidden=count!==0;
    $('#site-focus').hidden=!single;
    $('#site-focus-name').textContent=single?`正在查看：${cards.find(c=>c.dataset.site===single).dataset.name}`:'';
    $$('[data-category-link]').forEach(link=>{if(link.dataset.categoryLink===category)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
  }
  $('#site-search')?.addEventListener('input',()=>update({site:null},'sites',true));
  for(const [id,key] of [['site-category','siteCategory'],['site-topic','topic'],['site-origin','siteOrigin'],['site-sort','sort'],['site-usage','siteUsage'],['design-tag','designTag']])$('#'+id)?.addEventListener('change',e=>update({[key]:e.target.value,site:null},'sites'));
  function resetSites(){
    $('#site-search').value='';
    update({site:null,siteCategory:null,topic:null,filter:null,siteOrigin:null,siteUsage:null,sort:null,designTag:null},'sites');$('#site-search').focus();
  }
  for(const id of ['reset-sites','empty-reset-sites','clear-site'])$('#'+id)?.addEventListener('click',resetSites);
  const guideCards=$$('.knowledge-card[data-card]');
  const topicCards=$$('.topic-card');
  function renderGuides(){
    if(!guideCards.length)return;
    const p=params();
    const topic=Object.hasOwn(topics,p.get('topic'))?p.get('topic'):null;
    const group=Object.hasOwn(groups,p.get('filter'))?p.get('filter'):'all';
    let single=guideCards.some(c=>c.dataset.card===p.get('card'))?p.get('card'):null;
    if(hash.startsWith('card-')&&guideCards.some(c=>c.id===hash))single=hash.slice(5);
    const query=$('#guide-search').value.trim().toLocaleLowerCase();
    const topicQuery=$('#topic-search').value.trim().toLocaleLowerCase();
    let count=0,topicCount=0;
    for(const card of guideCards){
      const match=(!single||card.dataset.card===single)&&(!topic||single||card.dataset.guideTopic===topic)&&(group==='all'||single||groups[group].includes(card.dataset.guideTopic))&&card.dataset.guideSearch.toLocaleLowerCase().includes(query);
      card.hidden=!match;if(match)count++;if(single===card.dataset.card)card.open=true;
    }
    for(const card of topicCards){
      const match=(!topic||card.dataset.topic===topic)&&(group==='all'||groups[group].includes(card.dataset.topic))&&`${card.dataset.search} ${card.textContent}`.toLocaleLowerCase().includes(topicQuery);
      card.hidden=!match;if(match)topicCount++;
    }
    $('#guide-topic').value=single?'all':topic||'all';
    $('#guide-result-count').textContent=`显示 ${count} / ${guideCards.length} 张公开知识卡`;
    $('#guide-empty').hidden=count!==0;$('#guide-focus').hidden=!single;
    $('#guide-focus-name').textContent=single?`正在阅读：${guideCards.find(c=>c.dataset.card===single).querySelector('h3').textContent}`:'';
    $('#result-count').textContent=`显示 ${topicCount} / 6 个专题`;$('#empty-state').hidden=topicCount!==0;
    $('#topic-focus').hidden=!topic;$('#topic-focus-name').textContent=topic?`正在查看：${topics[topic]}`:'';
    $$('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===group)));
  }
  $('#guide-search')?.addEventListener('input',()=>update({card:null},'guides',true));
  $('#guide-topic')?.addEventListener('change',e=>update({topic:e.target.value,filter:null,card:null},'guides'));
  $('#topic-search')?.addEventListener('input',()=>update({topic:null,card:null},'atlas',true));
  $$('[data-filter]').forEach(button=>button.addEventListener('click',()=>update({filter:button.dataset.filter,topic:null,card:null},'atlas')));
  function resetGuides(){
    $('#guide-search').value='';$('#topic-search').value='';update({topic:null,filter:null,card:null},'guides');$('#guide-search').focus();
  }
  for(const id of ['clear-guide','reset-guides','empty-reset-guides','clear-topic','reset-search'])$('#'+id)?.addEventListener('click',resetGuides);
  const tools=$$('.tool-card');
  function renderToolbox(){
    if(!tools.length)return;
    const p=params();const query=$('#toolbox-search').value.trim().toLocaleLowerCase();
    const category=[...$('#toolbox-category').options].some(o=>o.value===p.get('toolboxCategory'))?p.get('toolboxCategory'):'all';
    const status=['all','mine','observed','candidate'].includes(p.get('recommendation'))?p.get('recommendation'):'all';
    const single=tools.some(t=>t.dataset.tool===p.get('tool'))?p.get('tool'):null;
    let count=0;
    for(const tool of tools){
      const state=status==='all'||status==='mine'&&tool.dataset.endorsement==='recommended'||status==='observed'&&tool.dataset.installation==='observed'||status==='candidate'&&tool.dataset.endorsement==='candidate';
      tool.hidden=!((!single||tool.dataset.tool===single)&&(single||state)&&(category==='all'||tool.dataset.category===category)&&tool.dataset.search.toLocaleLowerCase().includes(query));
      if(!tool.hidden)count++;
    }
    $('#toolbox-category').value=category;$('#toolbox-status').value=status;
    $('#toolbox-result-count').textContent=`显示 ${count} / ${tools.length} 个工具`;
    $('#toolbox-empty').hidden=count!==0;
  }
  $('#toolbox-search')?.addEventListener('input',()=>update({tool:null},'toolbox',true));
  $('#toolbox-category')?.addEventListener('change',e=>update({toolboxCategory:e.target.value,tool:null},'toolbox'));
  $('#toolbox-status')?.addEventListener('change',e=>update({recommendation:e.target.value,tool:null},'toolbox'));
  $('#reset-toolbox')?.addEventListener('click',()=>{$('#toolbox-search').value='';update({toolboxCategory:null,recommendation:null,tool:null},'toolbox');});
  $('#global-search')?.addEventListener('input',event=>{
    const query=event.target.value.trim().toLocaleLowerCase();const box=$('#global-results');box.replaceChildren();
    if(!query){box.hidden=true;$('#global-result-count').textContent='搜索网站、知识卡或效率工具';return;}
    const results=SEARCH_INDEX.filter(record=>record.search.toLocaleLowerCase().includes(query));
    $('#global-result-count').textContent=`找到 ${results.length} 项，显示前 ${Math.min(results.length,12)} 项`;
    for(const record of results.slice(0,12)){
      const a=document.createElement('a');a.href=record.href;
      const type=document.createElement('span');type.className='result-type';type.textContent=record.type;
      const name=document.createElement('strong');name.textContent=record.title;
      const desc=document.createElement('small');desc.textContent=record.summary;
      a.append(type,name,desc);box.append(a);
    }
    box.hidden=false;
  });
  function render(){renderSites();renderGuides();renderToolbox();}
  window.addEventListener('popstate',()=>{for(const id of ['site-search','guide-search','topic-search','toolbox-search'])if($('#'+id))$('#'+id).value='';hash=location.hash.slice(1);render();revealHash();});
  window.addEventListener('hashchange',()=>{hash=location.hash.slice(1);render();revealHash();});
  render();revealHash();
  const form=$('#prompt-form');
  function generatePrompt(){
    const data=new FormData(form);const fields=[['task','任务'],['reader','读者'],['scene','场景'],['material','材料'],['format','格式与长度'],['limits','限制'],['acceptance','验收项']];
    $('#generated-prompt').textContent=fields.map(([key,label])=>`${label}：${String(data.get(key)||'').trim()||'未说明，请先询问'}`).join('\n\n')+'\n\n缺信息先问：开始前若有影响结果的缺失信息，请先列出最多三个关键问题；不要自行编造。完成后按验收项逐条标明已满足或待核实。';
  }
  if(form){generatePrompt();form.addEventListener('submit',event=>{event.preventDefault();generatePrompt();toast('提问已生成，复制前核对一次。');});}
  let timer;
  function toast(message){if(!$('#toast'))return;clearTimeout(timer);$('#toast').textContent=message;$('#toast').hidden=false;timer=setTimeout(()=>{$('#toast').hidden=true;},3500);}
  $$('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const target=document.getElementById(button.dataset.copy);
    try{if(!navigator.clipboard||!window.isSecureContext)throw Error();await navigator.clipboard.writeText(target.textContent);toast('已复制。提交前再核对一次。');}
    catch{const range=document.createRange();range.selectNodeContents(target);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);toast('已选中文本，请按 Ctrl/Cmd+C 或长按复制。');}
  }));
  const chapters=[['00:00','导语'],['00:32','近三年AI变化'],['03:38','提示词提问'],['07:47','学AI的含义'],['09:50','设备入门'],['13:53','第一个Agent'],['17:22','程序工具'],['20:08','模型与工具配合'],['23:50','大模型'],['26:36','Agent成本（上）'],['31:16','Agent成本（下）'],['38:08','使用方法'],['43:38','人还学什么'],['49:08','复习']];
  if($('#chapter-list'))for(const [time,title] of chapters){const [m,s]=time.split(':').map(Number);const a=document.createElement('a');a.href=`https://www.bilibili.com/video/BV1VZWc6dECG/?t=${m*60+s}`;a.target='_blank';a.rel='noopener noreferrer';const stamp=document.createElement('span');stamp.textContent=time;const label=document.createElement('strong');label.textContent=title;a.append(stamp,label);$('#chapter-list').append(a);}
})();
