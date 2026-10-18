import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {FEEDBACK_TYPES,PAGE_ROUTES,REPOSITORY,SITE_ORIGIN,canonicalPageURL,feedbackContext,feedbackEntryURL,issueFormURL} from '../source/feedback.mjs';
const root=resolve(import.meta.dirname,'..');
const directory=resolve(root,'.github/ISSUE_TEMPLATE');
assert.deepEqual((await readdir(directory)).sort(),['bug.yml','config.yml','experience.yml','feature.yml','recommendation.yml']);
// JSON-compatible YAML is parsed without a third-party dependency in CI.
for(const type of FEEDBACK_TYPES){
 const form=JSON.parse(await readFile(resolve(directory,type.id+'.yml'),'utf8'));
 assert(form.name&&form.description&&form.title&&Array.isArray(form.body));
 assert.equal(new Set(form.body.filter(f=>f.id).map(f=>f.id)).size,form.body.filter(f=>f.id).length);
 assert(form.body.some(f=>f.id==='page'&&f.type==='input'&&f.validations.required===false));
 assert(form.body.some(f=>f.type==='textarea'&&f.validations.required===true));
 for(const f of form.body){
  assert(['markdown','input','textarea'].includes(f.type));
  if(f.type==='markdown'){assert(f.attributes.value.includes('公开')&&f.attributes.value.includes('密钥')&&f.attributes.value.includes('/issues?q=')&&f.attributes.value.includes('/security/policy'));continue;}
  assert(/^[a-z][a-z0-9-]*$/.test(f.id)&&f.attributes.label);
  assert.equal(typeof f.validations.required,'boolean');
 }
 const encoded=JSON.stringify(form);
 assert.equal(Buffer.from(encoded,'utf8').toString('utf8'),encoded);
 assert(!form.assignees&&!form.labels&&!form.projects);
}
const config=JSON.parse(await readFile(resolve(directory,'config.yml'),'utf8'));
assert.equal(config.blank_issues_enabled,false);assert.equal(config.contact_links.length,2);
assert(config.contact_links.every(link=>link.url.startsWith(REPOSITORY+'/')));
const privateValue='PRIVATE_VALUE_NOT_TO_FORWARD';
const longQuery=encodeURIComponent('长文本 & ? # = + % 😊\n'.repeat(3000));
for(const [slug,route] of Object.entries(PAGE_ROUTES)){
 const page=SITE_ORIGIN+'/ai-hub/'+route;
 const dirty=page+'?q='+longQuery+'&token='+privateValue+'#private-fragment';
 assert.equal(canonicalPageURL(dirty),page);
 const entry=new URL(feedbackEntryURL(slug),SITE_ORIGIN);
 assert.deepEqual([...entry.searchParams.keys()],['from']);assert.equal(entry.searchParams.get('from'),slug);
 assert.equal(feedbackContext(entry.href+'&account='+privateValue),page);
 for(const type of FEEDBACK_TYPES){
  const link=new URL(issueFormURL(type.id,dirty));
  assert.equal(link.origin,'https://github.com');assert.equal(link.pathname,'/zxs4KHf/ai-native-community/issues/new');
  assert.deepEqual([...link.searchParams.keys()],['template','page']);
  assert.equal(link.searchParams.get('template'),type.id+'.yml');assert.equal(link.searchParams.get('page'),page);
  assert(!link.href.includes(privateValue)&&link.href.length<300);
 }
 const file=slug==='home'?'index.html':route+'index.html';
 const html=await readFile(resolve(root,'public',file),'utf8');
 assert(html.includes('class="feedback-fab" data-feedback-entry'));
 assert(/<nav aria-label="主导航">[\s\S]*?data-feedback-entry/.test(html));
 assert(/<footer class="site-footer">[\s\S]*?data-feedback-entry/.test(html));
}
for(const input of ['https://evil.invalid/ai-hub/tools/','javascript:alert(1)','https://name:secret@api.190675.xyz/ai-hub/tools/','/ai-hub/unknown/'])assert.equal(canonicalPageURL(input),SITE_ORIGIN+'/ai-hub/');
assert.equal(feedbackContext(SITE_ORIGIN+'/ai-hub/feedback/?from='+longQuery),SITE_ORIGIN+'/ai-hub/feedback/');
assert.throws(()=>issueFormURL('../bad',SITE_ORIGIN+'/ai-hub/'));
const feedback=await readFile(resolve(root,'public/feedback/index.html'),'utf8');
assert.equal([...feedback.matchAll(/data-feedback-template=/g)].length,4);
assert(feedback.includes('登录')&&feedback.includes('自行点击提交')&&feedback.includes('反馈是公开的')&&feedback.includes('脱敏'));
assert(feedback.includes('/security/policy')&&feedback.includes('可信私下渠道'));
const toolbox=await readFile(resolve(root,'public/toolbox/index.html'),'utf8');
assert(!/本轮|用户在|用户同意|不扩写|编辑选题|用户明确确认/.test(toolbox));
assert(toolbox.includes('站长试用推荐：截图贴屏后可直接选字。')&&toolbox.includes('基础工具收录，暂未附使用评价。'));
const home=await readFile(resolve(root,'public/index.html'),'utf8');assert(home.includes('55 张公开卡')&&!/原整理|61卡|61张/.test(home));
console.log('Four Issue Forms and 40 prefill paths passed; long Unicode input, URL encoding, public notices, duplicate search, sensitive-query stripping and copy boundaries verified.');
