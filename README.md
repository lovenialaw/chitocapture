# ChitoCapture

**A prototype dashboard for organisational carbon tracking and chitosan-based CO₂ capture scenarios.**

ChitoCapture brings carbon inventory workflows and a simplified carbon-capture process model into one web application. It is intended for sustainability teams, facility managers, and process engineers who want to review emissions, understand major sources, and explore how a capture system might behave.

> **Prototype notice:** This application is not connected to live plant sensors or a production database. Process readings and capture results are simulated. Shared preview records are illustrative demo data; they are not verified company disclosures or proof of real plant performance.

## Open the dashboard

The public preview is hosted on GitHub Pages:

[https://lovenialaw.github.io/chitocapture/](https://lovenialaw.github.io/chitocapture/)

## What you can do

- **Carbon Dashboard** — review saved organisational emissions, trends, breakdowns, and reduction targets.
- **Carbon Footprint Calculator** — enter activity data for electricity, fuel, transport, waste, industrial activity, and other sources; select emission factors; review calculations; and save inventory records.
- **Emission Hotspots** — find the largest saved sources, inspect their calculation details, and pass relevant source context to capture scenario analysis.
- **Scenario Analysis** — change capture operating inputs and run a time-varying process-model scenario.
- **Process Monitoring** — view the CAD-derived plant model alongside simulated inlet/outlet readings and adsorbent status.
- **Carbon Flow** — inspect the capture model’s CO₂ input, captured amount, remaining amount, and destination flow.
- **Capture Summary** — see summary metrics from the capture simulation.
- **Data & Sources** — review emission factors, GWP methodology, capture parameters, and their recorded source information.
- **Reports** — prepare performance or MRV-oriented report previews from the available inventory and capture snapshots.

Organisational emissions and process capture are separate calculations. Simulated captured CO₂ is **not automatically subtracted** from the organisational inventory. Any comparison or reduction claim needs an explicitly mapped, reviewed boundary and supporting data.

## How the calculations work

For an inventory activity, the calculator converts the entered activity amount to a compatible factor unit, multiplies it by the selected factor, and converts kilograms to tonnes:

```text
kg CO₂e = normalised activity × emission factor
t CO₂e = kg CO₂e ÷ 1,000
```

Factors expressed as CO₂e are used as supplied. For separate methane or nitrous oxide factors, the calculator requires a sourced GWP set before converting to CO₂e. Each saved inventory record keeps its period, activity, factor, source, scope, and calculation method for review.

The capture pages use a separate simplified adsorption/regeneration model. Capture is limited by the scenario’s inputs and adsorbent capacity. The model reports captured and remaining CO₂ as simulated outputs; it is not a validated design or forecast for an operating kiln.

## Shared preview data and privacy

New or empty browser profiles start with a small Malaysia-focused demo dataset so visitors can explore the dashboard. The demo organization is named **Malaysia Cement Demonstration Company**. Its activity records are marked estimated, and user-entered demo factors are marked unverified. Placeholder sources are explicitly identified as needing verification.

The app stores edits in that browser’s `localStorage` under `chitocapture.organisation-carbon.v1`. This is local to each browser and device: edits made by one visitor are not sent to GitHub or shared with other visitors. The bundled demo seed is public with the repository; do not place confidential company or personal information in the public demo data.

## Run locally

Requirements: Node.js 22 (the GitHub Pages workflow uses Node 22) and npm.

```powershell
cd viewer
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://127.0.0.1:5173/`.

Create a production build or preview it locally with:

```powershell
npm run build
npm run preview
```

## Deployment

GitHub Actions builds the Vite app from `viewer/` and deploys `viewer/dist` to GitHub Pages whenever a commit is pushed to `main`. The workflow is in [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Project structure

```text
viewer/
├── public/models/       # CAD-derived GLB used by Process Monitoring
├── src/
│   ├── assets/          # App assets
│   ├── components/      # Shared UI and 3D viewer components
│   ├── data/            # Registries, assumptions, and demo dataset
│   ├── pages/           # Dashboard pages
│   ├── simulation/      # Carbon and capture calculations
│   ├── types/           # Shared TypeScript models
│   └── utils/           # Shared helpers
├── package.json
└── vite.config.ts
```

The interface uses React, TypeScript, Vite, Three.js, and React Three Fiber. The Process Monitoring viewer loads the GLB model; equipment geometry is not recreated in React.

## Important limitations

- Demo values and simulated readings are for prototype exploration, not measured plant data.
- Emission-factor applicability, geography, year, units, scope, and source should be reviewed by the organisation before reporting.
- A user-entered factor marked “verified” in the app has not necessarily been independently audited.
- The capture model and simplified CAD layout are not engineering design, safety review, permitting, or a guarantee of capture performance.
- Reports are generated from the information available in the prototype and should be reviewed before external or regulatory use.
