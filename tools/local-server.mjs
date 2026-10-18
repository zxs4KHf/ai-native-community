import http from 'node:http';
import worker from '../worker.mjs';
const server = http.createServer(async (req,res) => {
  try {
    const url = `http://127.0.0.1:${server.address().port}${req.url}`;
    const result = await worker.fetch(new Request(url,{method:req.method}));
    res.writeHead(result.status,Object.fromEntries(result.headers));
    res.end(Buffer.from(await result.arrayBuffer()));
  } catch { res.writeHead(500); res.end('Local server error'); }
});
server.listen(0,'127.0.0.1',() => console.log(`Local: http://127.0.0.1:${server.address().port}/ai-hub/`));
