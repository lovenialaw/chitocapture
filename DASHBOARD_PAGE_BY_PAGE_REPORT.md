# ChitoCapture Dashboard — Page-by-Page Review

**Review date:** 27 September 2026  
**Reviewed deployment:** [lovenialaw.github.io/chitocapture](https://lovenialaw.github.io/chitocapture/)  
**Scope:** The six pages currently linked in the dashboard navigation. This review describes the live prototype and its displayed simulation outputs; it is not an engineering validation or an independent verification of capture performance.

## Executive summary

The dashboard presents a simulated cement-kiln CO₂ capture system with a Malaysia sample-plant configuration. It separates operating visualization, scenario inputs, carbon and energy summaries, parameter provenance, and report preparation into six pages. The primary navigation and page routes work at the GitHub Pages project path.

The displayed default case uses a 22 vol% CO₂ feed at 150,000 Nm³/h, with assumed process inputs for the chitosan capture unit. For April 2026, the Carbon Flow page reports 46,682.2 t CO₂ entering the modeled boundary, 126.7 t captured, and 46,555.5 t remaining. Its mass balance reconciles. Reported capture efficiency is about 0.27%; the modeled capture energy is about 291 MWh.

The most important interpretation point is that these are prototype estimates, not real plant measurements. The dashboard labels them as simulated. The adsorber research references shown in Data & Sources describe CS-TEPA-700 research, while the model configuration names XS-TEPA-700; the page explicitly cautions that those research values do not verify the model's working capacity.

## 1. Executive Dashboard

### Purpose and contents

This is the overview page. It shows the source configuration, time-selection controls, live-style KPIs, an emissions trend chart, and cumulative impact comparisons. The default configuration displayed is Cement / Cement kiln / Malaysia (Sample Plant), with data mode marked as simulated.

The page supports live, custom-date, and monthly-report views, plus chart ranges of today, 7 days, and 30 days. Cumulative impact can be switched between monthly and yearly views. The chart and KPI descriptions identify the values as model outputs or estimates.

### Displayed default snapshot

- Baseline emissions: **1,549.4 t/day**
- Remaining emissions: **1,545.2 t/day**
- CO₂ captured: **4.2 t/day**
- Capture efficiency: **0.27%**
- Energy intensity: **2,290.3 kWh/tCO₂**
- Data completeness: **94% (17 of 18 inputs)**
- April cumulative impact: **126.7 tCO₂ captured**, **291 MWh energy**, **0.27% emission reduction**
- CO₂ intensity per product is unavailable because product output is not configured.

Tree-year and car-year comparisons are identified as illustrative and tied to explicit assumptions.

### Review

The page gives a useful high-level picture and makes the simulation status visible. Its 94% completeness indicator has a clear explanation: product output is the missing required input. The main interpretation risk is that the headline calls the metrics “Live” even though the data is simulated; the nearby simulation badge and descriptions mitigate this, but the page should continue to keep “simulated” prominent wherever values are exported or shared.

## 2. Process Monitoring

### Purpose and contents

The center of the page is the GLB-based plant viewer. It shows the process from flue-gas inlet through pre-treatment and the adsorber to the stack, with a secondary CO₂ recovery path. The viewer provides equipment labels, a labels toggle, a phase indicator, a process-flow legend, and an equipment information dock. Clicking the inlet or stack label opens the corresponding simulated gas-measurement panel; other labels open equipment-specific details.

The adjacent Adsorbent Status panel shows adsorption state, loading, capture efficiency, elapsed time, time to regeneration, operating limit, cycle count, and first-cycle date. A visible notice says readings are simulated and no industrial sensors are connected. A development-state panel is also present but collapsed by default.

### Displayed default snapshot

- Phase: **Adsorption**
- Adsorbent loading: **78.5%**, or **3.14 mmol/g of 4.0 mmol/g**
- Capture efficiency: **78.4%**
- Operating limit: **100%**
- Cycle count: **1**
- Time elapsed: **00:00:10**; estimated time to regeneration: **00:00:12**
- The page clock is displayed in **MYT**.

### Review

The 3D CAD model is the visual source of truth, and the screen-space labels make the equipment selectable without rebuilding the geometry in React. The inlet and treated-gas measurement panels are not persistently visible in the initial state: users must select the corresponding label to open those readings. That interaction is functional but less discoverable than always-visible measurement cards.

The displayed **78.4%** capture efficiency is much higher than the **0.27%** period-level efficiency on the Executive Dashboard and Carbon Flow pages. These figures come from different simulation views and time bases, but the distinction is not obvious from the metric name alone. Label the Process Monitoring figure as an instantaneous or current-step model estimate, or otherwise explain its denominator, so users do not read it as the monthly plant-wide capture efficiency.

## 3. Carbon Flow

### Purpose and contents

This page follows CO₂ through the modeled boundary. It provides industry and site context, a period selector (weekly, monthly, annual), a Sankey-style mass-flow view, carbon-flow KPIs, and a Before vs After Comparison section. The comparison section has Emissions and Energy views, including trend charts and a KPI table. Energy detail breaks modeled use into regeneration/desorption, gas handling/blowers, and auxiliary systems.

### Displayed default snapshot

For **April 2026**:

| Carbon-flow measure | Displayed value |
|---|---:|
| CO₂ input | 46,682.2 t |
| CO₂ captured | 126.7 t |
| CO₂ remaining | 46,555.5 t |
| Capture efficiency | 0.27% |
| Modeled energy use | 291.1 MWh |

The shown carbon balance reconciles: input equals captured plus remaining. Carbon intensity is marked “Not specified” because product output is not in the parameter registry.

### Review

This page is the clearest place to explain the mass balance and the modeled boundary. It distinguishes captured CO₂ from remaining CO₂ and labels the outputs as simulated estimates. The Energy tab is useful for showing modeled energy components, but these are engineering-model outputs rather than measured plant loads. Keep the selected reporting period visible alongside every total, since 46,682.2 t is a monthly total rather than an instantaneous flow.

## 4. Scenario Analysis

### Purpose and contents

Scenario Analysis is the operating-input workspace. It groups editable values into five steps: emission source, feed-gas conditions, capture-unit conditions, run simulation, and scenario results. Inputs include CO₂ concentration, flow, temperature, pressure, humidity, SO₂, NOₓ, particulates, adsorbent mass, working capacity, regeneration temperature and time, and cycle duration. Users select weekly, monthly, or yearly periods and run the model to produce emissions, capture-efficiency, and energy charts.

The page marks the displayed inputs as assumed and warns that scenario outputs are simulated estimates, not measured data. Its material-details link opens the source information associated with the chitosan reference.

### Displayed default inputs

- Industry / source / site: **Cement / Cement kiln / Malaysia (Sample Plant)**
- Feed: **22% CO₂**, **150,000 Nm³/h**, **180 °C**, **1.2 bar**, **12% humidity**, **120 ppm SO₂**, **90 ppm NOₓ**, **15 mg/Nm³ particulates**
- Capture unit: **40 °C adsorption**, **1,000 kg adsorbent**, **4 mmol/g assumed working capacity**, **110 °C regeneration**, **4 h cycle**, **0.75 h regeneration**

### Review

Inputs are organized clearly, and the user must explicitly press **Run and Analyse Scenario** after changing them. This avoids presenting stale results as though they reflected unsaved changes. A note directly explains that the 4 mmol/g scenario working capacity is an assumption and is not the same as a verified property for XS-TEPA-700.

On a fresh session, the results area can be empty until a scenario is run. That is expected behavior, but an initial prompt or example run would make the page easier to understand. The user should also be reminded that changing a scenario updates the shared scenario state used by other pages.

## 5. Data & Sources

### Purpose and contents

This is the provenance view. It has dynamically counted data categories, filters, a key-parameter table with source links, chitosan material properties, and a source library with detail dialogs. It states that system readings are simulated unless identified otherwise.

### Displayed registry summary

- **19 simulated** parameters
- **6 literature** parameters
- **46 assumed** parameters
- **3 source records**: a literature record, an assumption placeholder, and the simulation-configuration record

The listed literature values include a 4.68 mmol/g reference capacity at 10 °C and 1 bar, adsorption temperature and pressure, an ultramicropore volume, a regeneration result after 10 cycles, and a study-series maximum surface area. The page clearly says the values concern CS-TEPA-700 research and are not verified for the model material XS-TEPA-700. Density and regeneration temperature/energy remain unverified.

### Review

The strict separation of Literature, Assumed, and Simulated is a strength. The page avoids inventing values for missing properties and flags the source placeholder as **SOURCE TO BE VERIFIED**. The main usability limitation is that the key-parameter table is intentionally shortened until **View all parameters** is selected; users looking for a specific parameter may not see it immediately. Source details are opened from the Source Library or source-ID buttons.

## 6. Reports

### Purpose and contents

Reports provides monthly, quarterly, and yearly report types, a reporting-period selector, a contents preview, a cover preview, and PDF download after a report snapshot is generated. The preview is organized into 18 sections: executive summary; source and feed configuration; capture configuration; emissions, capture, energy and carbon flow; operating performance; data quality; methodology and limitations; and six appendices. A second **MRV Reports** workspace provides a monitoring, reporting, and verification-support summary.

The MRV workspace explicitly says it is not a certified MRV platform and that it does not independently verify emissions. The report snapshot is described as fixed so later scenario changes do not alter it.

### Current entry state and review

On opening the page, the reporting controls and cover template are visible, but the contents preview and PDF download are not populated until **Generate Report** is selected. The cover initially has no selected period or scenario values. Available periods in the current view include April 2026 through March 2027; these are simulation periods, not operational records.

Before sharing a report, generate a snapshot and review the displayed source statuses, mass-balance result, energy-balance result, missing/invalid parameters, and data-completeness figure. The page correctly distinguishes verification support from actual verification.

## Cross-page consistency and interpretation

1. **Mass balance:** Carbon Flow reconciles 46,682.2 t input to 126.7 t captured plus 46,555.5 t remaining for the displayed month.
2. **Period versus current-step efficiency:** Executive Dashboard and Carbon Flow show roughly 0.27% period-level capture efficiency. Process Monitoring shows 78.4% in its current adsorbent-status panel. These should be explicitly labeled with their different time bases/definitions.
3. **Simulation clocks:** Process Monitoring begins around 1 April 2026 08:00 MYT, while the Executive Dashboard live-style time is around 2 April 2026 08:00 MYT. The pages use separate simulated views, so the timestamps should not be interpreted as a single synchronized plant clock.
4. **Provenance:** The deployed default site is named Malaysia (Sample Plant), and source configuration values are marked assumed. The dashboard does not show connected or measured site data.
5. **Adsorbent evidence:** Literature properties shown for CS-TEPA-700 are reference information only. The model material is XS-TEPA-700; its assumed 4 mmol/g working capacity is not validated by those literature records.
6. **Unavailable product intensity:** CO₂ intensity per tonne of product remains unavailable across the overview and carbon-flow views because product output is unspecified.

## Recommended next improvements

1. Clarify that Process Monitoring’s 78.4% figure is a current-step estimate and show how it differs from the 0.27% period-level metric.
2. Make the inlet and treated-gas measurement panels more discoverable, since they currently require selecting their viewer labels.
3. Add a short “Run a scenario to see results” cue or a sample result state to Scenario Analysis for first-time visitors.
4. On Reports, make the required **Generate Report** step prominent before the contents and PDF controls, and show snapshot provenance beside the generated timestamp.
5. Keep the Malaysia sample site clearly labeled as a sample/assumption until a real site configuration and verified operational data are registered.

## Overall conclusion

The dashboard is a functioning, navigable prototype with distinct pages for overview, process visualization, scenario inputs, carbon/energy accounting, data provenance, and reporting. Its strongest integrity feature is the repeated disclosure that readings are simulated and its clear distinction between assumptions and literature references. The principal interpretation issue is the difference between the 78.4% process-status efficiency and the 0.27% period-level efficiency; explaining those definitions would make cross-page comparisons safer. No displayed result should be presented as a measured or independently verified plant outcome.
