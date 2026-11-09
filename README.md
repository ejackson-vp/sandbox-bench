# sandbox-bench

Benchmarks and measurement tooling for the
[sandbox](https://github.com/ejackson-vp/sandbox) service. Kept out of the
product repo: it is measurement code, it pins the service version it measures,
and it does not belong in the service image or CI.

## Setup

The SDK and shared protocol packages are **not published to npm**. This repo
therefore depends on a sibling checkout:

```bash
git clone https://github.com/ejackson-vp/sandbox
git clone https://github.com/ejackson-vp/sandbox-bench
cd sandbox && npm ci && npm run build
cd ../sandbox-bench && npm install
```

`package.json` uses `file:../sandbox/sdk` and `file:../sandbox/shared`. Switch
those to registry versions once the packages are published.

## Cluster benchmarks

Against a running API (mock payments):

```bash
API_URL=https://sandbox-api.<tailnet>.ts.net npm run cluster:startup -- --samples 30 --pace 1200
API_URL=... npm run cluster:exec -- --samples 50
API_URL=... npm run cluster:burst -- --n 25
API_URL=... npm run cluster:hold -- --n 60
```

`cluster:startup` records both client-observed and server-side
(`createdAt → readyAt`) readiness. Results land under `benchmarks/results/`.

## Harness (kind/Docker)

The full harness (`benchmarks/harness/cli.ts`) expects the kind environment and
Docker access; see [benchmarks/README.md](benchmarks/README.md). Commands:

```bash
npm run harness -- startup --samples 100
npm run harness -- density --levels 1,5,10,25 --mode idle
npm run harness -- burst --levels 50 --max 50 --yes
```

The methodology and result write-ups live in the product repo under `docs/`
(`performance-cluster.md`, `performance-report.md`, `benchmark-methodology.md`).
