import { SandboxClient } from "@x402s/sdk";
const c = new SandboxClient({ apiUrl: process.env.API_URL!, paymentMode: "mock" });
const rows: any[] = [];
for (let i = 0; i < 10; i++) {
  const t0 = performance.now();
  const h = await c.createSession({ tier: "short" });
  const paid = performance.now() - t0;
  const s = await c.waitForReady(h);
  const ready = performance.now() - t0;
  rows.push({
    paid: Math.round(paid),
    ready: Math.round(ready),
    server: Date.parse(s.readyAt!) - Date.parse(s.createdAt),
    t: s.timings,
  });
  await c.destroy(h);
  await new Promise((r) => setTimeout(r, 1200));
}
const pick = (f: string) => rows.map((r) => r.t?.[f]).filter((v: any) => typeof v === "number");
const stat = (a: number[]) => a.length ? `n=${a.length} p50=${Math.round([...a].sort((x,y)=>x-y)[Math.floor(a.length/2)])}` : "n=0";
console.log("client createSession", stat(rows.map(r=>r.paid)));
console.log("client waitForReady", stat(rows.map(r=>r.ready)));
console.log("server createdAt->readyAt", stat(rows.map(r=>r.server)));
for (const f of ["entitlementMs","paymentVerifyMs","paymentSettleMs","warmPickMs","warmRegisterMs","warmClaimCallMs","warmRelabelMs","podCreateCallMs"]) {
  const a = pick(f); if (a.length) console.log(f, stat(a));
}
console.log("warmPoolHit", rows.map(r=>r.t?.warmPoolHit).join(","));
console.log(JSON.stringify(rows[0]?.t ?? {}, null, 1));
