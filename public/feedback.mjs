export const REPOSITORY='https://github.com/zxs4KHf/ai-native-community';
export const SITE_ORIGIN='https://api.190675.xyz';
export const PAGE_ROUTES=Object.freeze({home:'',tools:'tools/',design:'design/',guides:'guides/',start:'start/',community:'community/',toolbox:'toolbox/',workshop:'workshop/',videos:'videos/',feedback:'feedback/'});
export const FEEDBACK_TYPES=Object.freeze([
 {id:'experience',label:'使用体验',description:'哪里顺手，哪里卡住？说说所在页面和你希望的体验。'},
 {id:'feature',label:'功能建议',description:'你想完成什么事？说明现有入口为什么还不够。'},
 {id:'bug',label:'Bug 报告',description:'提供复现步骤、预期与实际结果，截图请先脱敏。'},
 {id:'recommendation',label:'网站 / Idea 推荐',description:'分享一个网站或想法，用一句话说明用途和推荐原因。'}
]);
export function canonicalPageURL(raw){
 try{
  const url=new URL(raw,SITE_ORIGIN);
  if(url.origin!==SITE_ORIGIN||url.username||url.password)return SITE_ORIGIN+'/ai-hub/';
  const paths=Object.values(PAGE_ROUTES).map(route=>'/ai-hub/'+route);
  return paths.includes(url.pathname)?SITE_ORIGIN+url.pathname:SITE_ORIGIN+'/ai-hub/';
 }catch{return SITE_ORIGIN+'/ai-hub/';}
}
export function feedbackEntryURL(slug){
 const page=Object.hasOwn(PAGE_ROUTES,slug)?slug:'home';
 return '/ai-hub/feedback/?'+new URLSearchParams({from:page});
}
export function feedbackContext(raw){
 try{
  const url=new URL(raw,SITE_ORIGIN);
  const page=url.searchParams.get('from');
  if(url.origin===SITE_ORIGIN&&url.pathname==='/ai-hub/feedback/'&&Object.hasOwn(PAGE_ROUTES,page))return SITE_ORIGIN+'/ai-hub/'+PAGE_ROUTES[page];
  return canonicalPageURL(url);
 }catch{return SITE_ORIGIN+'/ai-hub/';}
}
export function issueFormURL(type,page){
 if(!FEEDBACK_TYPES.some(item=>item.id===type))throw new TypeError('Unknown feedback type');
 const url=new URL(REPOSITORY+'/issues/new');
 url.search=new URLSearchParams({template:type+'.yml',page:canonicalPageURL(page)}).toString();
 return url.href;
}
if(typeof document!=='undefined'){
 const slug=document.body.dataset.page;
 // Only a known page slug is carried between pages. No query, hash or referrer is copied.
 const context=feedbackContext(SITE_ORIGIN+location.pathname+location.search);
 for(const link of document.querySelectorAll('[data-feedback-entry]')){
  if(slug!=='feedback')link.href=feedbackEntryURL(slug);
 }
 for(const link of document.querySelectorAll('[data-feedback-template]'))link.href=issueFormURL(link.dataset.feedbackTemplate,context);
 const source=document.getElementById('feedback-source');
 if(source)source.textContent=context;
}
