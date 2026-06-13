# World Cup Backend — Plan 4: AWS Deployment

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the Next.js app to AWS Amplify at `copa.prates.fyi` and wire up a daily Lambda (EventBridge → Lambda → GitHub API commit → Amplify rebuild) that keeps `data/fixtures.json` current through the knockout stage.

**Architecture:**
```
EventBridge (daily cron)
  → Lambda (Node.js 22)
      ├─ Fetch from football-data.org
      ├─ Read data/fixtures.json via GitHub Contents API
      ├─ Merge new fixtures
      └─ Commit updated file back via GitHub Contents API
           → Amplify detects push → rebuild (~3 min) → live
```

No git CLI. No `tsx`. No filesystem writes. The Lambda is self-contained plain TypeScript compiled to JS before upload.

**Prerequisites:** Plans 1–3 complete. `data/fixtures.json` committed to the branch. Route53 hosted zone for `prates.fyi` already exists.

**Plan sequence:** This is Plan 4 of 4. Fully independent from Plans 2–3 internals — depends only on the branch being deployable.

---

### Task 1: Set up AWS Amplify app for `copa.prates.fyi`

**What:** Create an Amplify Hosting app connected to the GitHub repo, set the custom subdomain, and confirm a successful first build.

**Files:**
- Create: `amplify.yml` (build spec)

- [ ] **Step 1: Create `amplify.yml`**

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

- [ ] **Step 2: Create Amplify app via AWS Console**

Go to AWS Console → Amplify → **New app → Host web app**.

1. Connect GitHub → select the repo → choose branch `feat/world-cup-backend` (or `main` after merge)
2. App name: `world-cup-copa`
3. Build settings: Amplify auto-detects Next.js — confirm it picked up `amplify.yml`
4. Framework: **Next.js - SSR** (not static)
5. Click **Save and deploy** — confirm the first build succeeds

- [ ] **Step 3: Add custom domain `copa.prates.fyi`**

In Amplify → App → **Domain management → Add domain**:

1. Enter `prates.fyi`
2. Add subdomain prefix `copa`
3. Amplify shows the CNAME records to add in Route53:
   - `copa.prates.fyi` → `<amplify-app-id>.amplifyapp.com` (CNAME)
   - Amplify validation record (for SSL)

- [ ] **Step 4: Add Route53 records**

In AWS Console → Route53 → Hosted zone for `prates.fyi`:

```
Type: CNAME
Name: copa
Value: <amplify-app-id>.amplifyapp.com
TTL: 300
```

Add the Amplify SSL validation CNAME record shown in Step 3.

- [ ] **Step 5: Verify**

Wait 5–10 minutes for DNS propagation, then:

```bash
curl -I https://copa.prates.fyi
```

Expected: `HTTP/2 200` from Amplify.

---

### Task 2: Create the Lambda sync function

**What:** A self-contained Node.js 22 Lambda that reads the current `data/fixtures.json` from GitHub, merges new fixtures from football-data.org, and commits the result back. No git CLI, no npm packages beyond what Lambda provides natively.

**Files:**
- Create: `lambda/sync/index.mjs`

The Lambda is plain ESM JavaScript (compiled from TypeScript manually or deployed as `.mjs`). It uses Node.js 22 native `fetch`.

- [ ] **Step 1: Write `lambda/sync/index.mjs`**

```js
// lambda/sync/index.mjs
// Runs on Node.js 22 (native fetch). No npm dependencies.

const GITHUB_API = "https://api.github.com";
const REPO = process.env.GITHUB_REPO;           // "username/world-cup-games"
const BRANCH = process.env.GITHUB_BRANCH;       // "feat/world-cup-backend" or "main"
const FILE_PATH = "data/fixtures.json";
const WC_CODE = "WC";

// Maps football-data.org TLA codes to our TeamCode.
const TLA_MAP = {
  ENG:"ENG", BRA:"BRA", ARG:"ARG", FRA:"FRA", GER:"GER",
  ESP:"ESP", POR:"POR", NED:"NED", BEL:"BEL", ITA:"ITA",
  CRO:"CRO", MEX:"MEX", CAN:"CAN", USA:"USA", JPN:"JPN",
  KOR:"KOR", MAR:"MAR", SEN:"SEN", URU:"URU", COL:"COL",
  GHA:"GHA", CMR:"CMR", ECU:"ECU", NGA:"NGA", SUI:"SUI",
  AUT:"AUT", DEN:"DEN", SRB:"SRB", TUR:"TUR", ROU:"ROU",
  UKR:"UKR", VEN:"VEN", PAR:"PAR", PAN:"PAN", HON:"HON",
  JAM:"JAM", EGY:"EGY", CIV:"CIV", COD:"COD", RSA:"RSA",
  KSA:"KSA", IRN:"IRN", AUS:"AUS", IRQ:"IRQ", JOR:"JOR",
  QAT:"QAT", UZB:"UZB", NZL:"NZL",
};

async function githubGet(path) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "world-cup-sync-lambda",
    },
  });
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status} ${res.statusText}`);
  return res.json();
}

async function readFixtures() {
  const data = await githubGet(
    `/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`
  );
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { fixtures: JSON.parse(content), sha: data.sha };
}

async function commitFixtures(fixtures, sha) {
  const content = Buffer.from(JSON.stringify(fixtures, null, 2)).toString("base64");
  const res = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "world-cup-sync-lambda",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `chore(sync): update fixtures ${new Date().toISOString().slice(0, 10)}`,
      content,
      sha,
      branch: BRANCH,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub PUT: ${res.status} ${body}`);
  }
}

async function fetchMatches() {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY not set");
  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${WC_CODE}/matches`,
    { headers: { "X-Auth-Token": key } }
  );
  if (!res.ok) throw new Error(`football-data.org: ${res.status} ${res.statusText}`);
  const body = await res.json();
  return body.matches;
}

export const handler = async () => {
  const { fixtures: existing, sha } = await readFixtures();
  const existingIds = new Set(existing.map(f => f.id));

  const matches = await fetchMatches();
  const added = [];
  const skipped = [];

  for (const m of matches) {
    const homeTla = m.homeTeam?.tla;
    const awayTla = m.awayTeam?.tla;
    if (!homeTla || !awayTla) continue;

    const home = TLA_MAP[homeTla];
    const away = TLA_MAP[awayTla];
    if (!home || !away) {
      skipped.push(`${homeTla} vs ${awayTla}`);
      continue;
    }

    const dateStr = m.utcDate.slice(0, 10);
    const id = `${home}-${away}-${dateStr}`;
    if (existingIds.has(id)) continue;

    added.push({
      id,
      home,
      away,
      kickoff: m.utcDate,
      city: "TBC",
      venue: m.venue ?? "TBC",
      group: m.group ?? m.stage,
      broadcasterIds: [],
    });
  }

  const summary = {
    existing: existing.length,
    added: added.length,
    skipped,
    needsBroadcasters: [...existing, ...added].filter(f => f.broadcasterIds.length === 0).length,
  };

  if (added.length > 0) {
    await commitFixtures([...existing, ...added], sha);
    console.log("Committed updated fixtures:", summary);
  } else {
    console.log("No new fixtures — skipped commit:", summary);
  }

  return summary;
};
```

> The Lambda only commits when there are new fixtures — avoids triggering a rebuild on no-op runs.

- [ ] **Step 2: Test locally before deploying**

```bash
GITHUB_TOKEN=ghp_xxx GITHUB_REPO=you/world-cup-games GITHUB_BRANCH=feat/world-cup-backend \
FOOTBALL_DATA_API_KEY=xxx node --input-type=module <<'EOF'
import { handler } from "./lambda/sync/index.mjs";
handler().then(console.log).catch(console.error);
EOF
```

Expected: logs `No new fixtures — skipped commit: { existing: 72, added: 0, ... }` (if group stage is complete).

---

### Task 3: Deploy Lambda + EventBridge cron

**What:** Create the Lambda function in AWS and wire an EventBridge daily cron rule to it. Everything via AWS Console.

- [ ] **Step 1: Create Lambda function**

AWS Console → Lambda → **Create function**:

- Name: `world-cup-sync`
- Runtime: **Node.js 22.x**
- Architecture: `arm64` (cheaper)
- Permissions: Create new role `world-cup-sync-role` with basic Lambda execution (CloudWatch Logs)

Click **Create function**.

- [ ] **Step 2: Upload Lambda code**

In the Lambda console, Code tab → **Upload from** → `.zip file`.

Create the zip locally:

```bash
cd lambda/sync
zip -r ../../world-cup-sync.zip index.mjs
cd ../..
```

Upload `world-cup-sync.zip`. Set handler to `index.handler`.

- [ ] **Step 3: Set environment variables**

In Lambda → Configuration → Environment variables → **Edit**:

| Key | Value |
|-----|-------|
| `FOOTBALL_DATA_API_KEY` | (your football-data.org key) |
| `GITHUB_TOKEN` | (GitHub PAT with `repo` write scope) |
| `GITHUB_REPO` | `your-username/world-cup-games` |
| `GITHUB_BRANCH` | `main` (or the deployed branch) |

- [ ] **Step 4: Set timeout**

Lambda → Configuration → General configuration → **Edit**:
- Timeout: `30` seconds (football-data.org + GitHub API, both fast)
- Memory: `128 MB` (default is fine)

- [ ] **Step 5: Create EventBridge rule**

AWS Console → EventBridge → Rules → **Create rule**:

- Name: `world-cup-daily-sync`
- Rule type: **Schedule**
- Schedule pattern: `cron(0 6 * * ? *)` — runs at 06:00 UTC (03:00 BRT) daily
- Target: Lambda function `world-cup-sync`
- Click **Create**

- [ ] **Step 6: Test the Lambda manually**

In Lambda console → Test tab → Create test event (empty JSON `{}`):

```json
{}
```

Click **Test**. Check execution result and CloudWatch logs.

Expected: `No new fixtures — skipped commit: { existing: 72, added: 0, ... }` (or fixture additions if new knockout games are available).

- [ ] **Step 7: Verify Amplify rebuild triggers (integration test)**

If the Lambda added fixtures in Step 6, open Amplify console and confirm a new build started. If no fixtures were added (no-op), manually edit `data/fixtures.json` (add a dummy fixture), push to the branch, and confirm Amplify auto-builds.

---

### Plan 4 Completion Check

- [ ] `https://copa.prates.fyi` returns 200 and renders the World Cup app
- [ ] `https://copa.prates.fyi/api/games` returns the fixture list (no CORS errors)
- [ ] Lambda test execution completes under 30 seconds with no errors
- [ ] EventBridge rule is enabled and targets the correct Lambda
- [ ] CloudWatch log group `/aws/lambda/world-cup-sync` exists and shows the test run
- [ ] On the next daily run (or a triggered test), Amplify auto-builds if fixtures were added
- [ ] `GITHUB_TOKEN` is **not** committed to the repo (only in Lambda env vars)

**Cost estimate (steady-state):**
- Amplify: ~$0/month within free tier (1 GB storage, 15 GB bandwidth)
- Lambda: ~$0/month (1 invocation/day × 30 days = 30 invocations — well within 1M free tier)
- EventBridge: $0 (scheduled rules are free)
- Route53: $0 (adding a record to existing hosted zone)
