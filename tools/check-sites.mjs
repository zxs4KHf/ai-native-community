import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const data=JSON.parse(await readFile(new URL('../data/sites.json',import.meta.url),'utf8'));
const html=await readFile(new URL('../public/tools/index.html',import.meta.url),'utf8');
const guideHtml=await readFile(new URL('../public/guides/index.html',import.meta.url),'utf8');
const baseline=JSON.parse(await readFile(new URL('../fixtures/original-sites.json',import.meta.url),'utf8'));
assert(data.entries.length>=baseline.entries.length);
assert.equal(new Set(data.entries.map(e=>e.id)).size,data.entries.length);
assert.equal([...html.matchAll(/class="site-card"/g)].length,data.entries.length);
for(const old of baseline.entries)assert.deepEqual(data.entries.find(e=>e.id===old.id),old);
assert.equal(data.categories.length,10);
assert.equal(data.categories.reduce((sum,c)=>sum+c.count,0),data.entries.length);
for(const category of data.categories) assert.equal(data.entries.filter(e=>e.category===category.id).length,category.count);
assert.equal([...guideHtml.matchAll(/class="topic-card"/g)].length,6);
assert(html.includes('不计入 61 张知识卡'));
const allowedKeys=['id','name','identity','category','tags','purpose','url','topics','verification','referral','caution'].sort();
const topics=new Set(['tools','subscription','api-cost','agent','creation','cloud']);
for(const entry of data.entries) {
  assert.deepEqual(Object.keys(entry).sort(),allowedKeys);
  assert.deepEqual(Object.keys(entry.verification).sort(),['status','checked_on','source_url'].sort());
  assert(entry.topics.length>0&&entry.topics.every(t=>topics.has(t)));
  assert(html.includes(`id="site-${entry.id}"`));
  for(const url of [entry.url,entry.verification.source_url]) {
    const parsed=new URL(url); assert.equal(parsed.protocol,'https:');
    assert(!parsed.username&&!parsed.password&&!parsed.search&&!parsed.hash);
  }
}
const invitations=data.entries.filter(e=>e.referral);
const expectedInvites={
  zivv:'https://zivv.pro/register?invite=4eb5c7cb',
  'neko-api':'https://790053500.com/register?aff=JLR769VT5LZP',
  callai:'https://sub.callai.one/register?aff=3KW7V7KWSKXV',
  codex666ai:'https://api.codex666ai.com/register?aff=46JPNCPKT9CR',
  fengchao:'https://fengchao-api.com/register?aff=3BCUX7QWUQQR',
  'heju-api':'https://www.hejuapi.com/register?invite_code=JoeI',
  'dragon-api':'https://newapi.dragon3api.com/sign-up?aff=mvKb',
  'beibei-api':'https://www.bb-api.com/register?aff=YM83YMD7XAUJ',
  tokenfactory:'https://www.acampus.cloud/sign-up?aff=7G5R'
};
assert.deepEqual(Object.fromEntries(invitations.map(e=>[e.id,e.referral.url])),expectedInvites);
assert.equal([...html.matchAll(/class="site-invite"/g)].length,9);
for(const entry of invitations) {
  assert.equal(entry.referral.disclosure,'本人邀请链接，可能获得平台奖励。现金返佣、比例、提现和到账规则均未核验；不承诺折扣或模型真实性。');
  assert.deepEqual(Object.keys(entry.referral).sort(),['url','ownership','disclosure'].sort());
  assert(!/\d+%|到账保证|保证返佣/.test(entry.referral.disclosure));
}
assert(html.includes('rel="noopener noreferrer sponsored"'));
assert(html.includes('本人邀请链接'));
assert(html.includes('本人邀请链接，可能获得平台奖励')&&html.includes('现金返佣、比例、提现和到账规则均未核验'));
assert(!html.includes('我的邀请链接（含返佣）'));
for(const id of ['chatgpt-learn','linuxdo-ai','tudingai','uuaihub']) assert.equal(data.entries.find(e=>e.id===id).category,'learning');
assert.equal(data.entries.find(e=>e.id==='eyecandy').category,'design');
for(const id of ['ztest','realmodel','modelverify']) {
  assert(data.entries.find(e=>e.id===id).caution.includes('不能证明模型真实身份'));
  assert(data.entries.find(e=>e.id===id).caution.includes('生产 API 密钥'));
}
const clean=JSON.stringify(data);
assert(!/displayed_reward_rate|benefit_note|ownership_evidence|Your Affiliate Code|Invite Link|当前账户|现有登录/.test(clean));
assert(!data.entries.some(e=>e.id==='aigc-nav'));
assert(!/ownership_evidence|pending_entries|bookmark|browser_profile|visited_at|last_visit|搜索词|收藏路径|访问时间|AppData/i.test(clean));
assert(!/sk-[\w-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer [\w.-]{20,}/.test(clean));
console.log(`${data.entries.length} unique site cards; all 51 original entries unchanged; 10 categories; 6 knowledge topics; 9 exact ownership-approved invitations; privacy and disclosure checks passed.`);
