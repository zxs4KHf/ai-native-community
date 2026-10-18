import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const roots=['source','data','fixtures','public','tools','.github'];
const top=['README.md','CONTRIBUTING.md','SOURCES.md','SECURITY.md','package.json','.gitignore','.gitattributes','worker.mjs','assets.mjs'];
async function list(path){let result=[];for(const item of await readdir(path,{withFileTypes:true})){const file=resolve(path,item.name);result.push(...item.isDirectory()?await list(file):[file]);}return result;}
const files=[...top.map(p=>resolve(root,p)),...(await Promise.all(roots.map(p=>list(resolve(root,p))))).flat()];
const rules=[
 ['machine path',/[A-Z]:[\\/](?:Users|vibecoding|Temp)[\\/]/i],
 ['credential',/sk-[A-Za-z0-9_-]{16,}|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|AIza[\w-]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+[\w.-]{20,}/],
 ['private transport',/internal-api-drive-stream|authcode\/\?code=|browser_profile|visited_at|last_visit|ownership_evidence/],
 ['private card',/id=["']card-b0[1-6]["']|"id"\s*:\s*"b0[1-6]"|data-guide-topic=["']community["']/],
 ['private document link',/https:\/\/[^\s"<>]*feishu[^\s"<>]*(?:03|04)[-_]/i]
];
for(const file of files){const text=await readFile(file,'utf8');for(const [name,pattern] of rules){if(file.includes(resolve(root,'tools'))&&!['machine path','credential'].includes(name))continue;assert(!pattern.test(text),`${name} in ${file.slice(root.length+1)}`);}}
const workflow=await readFile(resolve(root,'.github/workflows/ci.yml'),'utf8');
assert(!/secrets\.|id-token:\s*write|contents:\s*write|pull_request_target/.test(workflow));
console.log(`Repository privacy scan passed across ${files.length} approved source files; CI requires no secrets.`);
