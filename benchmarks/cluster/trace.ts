import { SandboxClient } from "@x402s/sdk";

const c = new SandboxClient({ apiUrl: process.env.API_URL!, paymentMode: "mock" });
const samples = Number(process.env.SAMPLES ?? 10);
const paceMs = Number(process.env.PACE_MS ?? 1200);
const rows: Record<string, any>[] = [];

for (let i = 0; i < samples; i++) {
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
  await new Promise((r) => setTimeout(r, paceMs));
}

const pick = (f: string) => rows.map((r) => r.t?.[f]).filter((v: unknown) => typeof v === "number");
const pct = (a: number[], p: number) => {
  const s = [...a].sort((x, y) => x - y);
  return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]);
};
const stat = (a: number[]) => (a.length ? `n=${a.length} p50=${pct(a, 50)} p95=${pct(a, 95)}` : "n=0");

const warm = rows.filter((r) => r.t?.warmPoolHit === 1);
const warmSteady = rows.filter((r, i) => i > 0 && r.t?.warmPoolHit === 1);
const paid = rows.map((r) => r.paid);
const ready = rows.map((r) => r.ready);
console.log("client createSession (all)     ", stat(paid));
console.log("client createSession (steady)  ", stat(paid.slice(1)));
console.log("client createSession (warm)    ", stat(warmSteady.map((r) => r.paid)));
console.log("client waitForReady (all)      ", stat(ready));
console.log("client to READY (warm)         ", stat(warm.map((r) => r.ready)));
console.log("server createdAt->readyAt      ", stat(rows.map((r) => r.server)));
console.log("server ready (warm)            ", stat(warm.map((r) => r.server)));
for (const f of [
  "entitlementMs",
  "paymentVerifyMs",
  "paymentSettleMs",
  "warmPickMs",
  "warmRegisterMs",
  "warmClaimCallMs",
  "warmRelabelMs",
  "podCreateCallMs",
]) {
  const a = pick(f);
  if (a.length) console.log(f.padEnd(31), stat(a));
}
console.log("warmPoolHit", rows.map((r) => r.t?.warmPoolHit).join(","));
