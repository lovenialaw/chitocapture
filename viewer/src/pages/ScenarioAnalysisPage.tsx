import { useState, useSyncExternalStore } from 'react'
import type { FormEvent, ReactNode } from 'react'
import Header from '../components/Header'
import SourceDetailsDialog from '../components/SourceDetailsDialog'
import { getAllParameters, getParameter, getParameterRevision, subscribeToParameters } from '../data/parameters'
import { sourceTypeLabel } from '../data/sources'
import { runScenario } from '../simulation/scenarioRunner'
import type { ScenarioPeriod, ScenarioResult, ScenarioSnapshot } from '../simulation/scenarioRunner'
import { getActiveScenarioResult, setActiveScenarioResult } from '../simulation/activeScenario'
import { scenarioValidationRules, validateScenarioDrafts } from '../simulation/scenarioValidation'
import type { ParameterSourceType } from '../types/parameters'

type Drafts = Record<string, string>

const sourceOptions = {
  industry: ['Cement', 'Steel', 'Power generation', 'Other'],
  'emission-source': ['Cement kiln', 'Boiler', 'Blast furnace', 'Other'],
  site: ['Malaysia (Sample Plant)', 'Demo site'],
}

const numericFields = [
  { id: 'feed-co2-concentration', label: 'CO₂ concentration', unit: '%' },
  { id: 'feed-flow-rate', label: 'Flue gas flow rate', unit: 'Nm³/h' },
  { id: 'feed-temperature', label: 'Temperature', unit: '°C' },
  { id: 'feed-pressure', label: 'Pressure', unit: 'bar' },
  { id: 'feed-humidity', label: 'Humidity', unit: '%' },
  { id: 'feed-so2', label: 'SO₂', unit: 'ppm' },
  { id: 'feed-nox', label: 'NOₓ', unit: 'ppm' },
  { id: 'feed-particulates', label: 'Particulates', unit: 'mg/Nm³' },
  { id: 'adsorption-temperature', label: 'Adsorption temperature', unit: '°C' },
  { id: 'adsorbent-mass', label: 'Adsorbent mass', unit: 'kg' },
  { id: 'adsorption-capacity', label: 'Scenario working capacity', unit: 'mmol/g' },
  { id: 'regeneration-temperature', label: 'Regeneration temperature', unit: '°C' },
  { id: 'cycle-duration', label: 'Cycle duration', unit: 'hours' },
  { id: 'regeneration-time', label: 'Regeneration time', unit: 'hours' },
] as const

function formattedInitialDrafts(): Drafts {
  const values = Object.fromEntries(getAllParameters().map((parameter) => [parameter.id, String(parameter.value)]))
  values['cycle-duration'] = String(Number(values['cycle-duration']) / 60)
  values['regeneration-time'] = String(Number(values['regeneration-time']) / 60)
  return values
}

function draftsFromSnapshot(snapshot: ScenarioSnapshot): Drafts {
  const drafts = formattedInitialDrafts()
  Object.assign(drafts, {
    industry: snapshot.industry,
    'emission-source': snapshot.emissionSource,
    site: snapshot.site,
    'feed-co2-concentration': String(snapshot.co2Concentration),
    'feed-flow-rate': String(snapshot.flowRate),
    'feed-temperature': String(snapshot.temperature),
    'feed-pressure': String(snapshot.pressure),
    'feed-humidity': String(snapshot.humidity),
    'feed-so2': String(snapshot.so2),
    'feed-nox': String(snapshot.nox),
    'feed-particulates': String(snapshot.particulates),
    'adsorption-temperature': String(snapshot.adsorptionTemperature),
    'adsorbent-mass': String(snapshot.adsorbentMass),
    'adsorption-capacity': String(snapshot.workingCapacity),
    'regeneration-temperature': String(snapshot.regenerationTemperature),
    'cycle-duration': String(snapshot.cycleDurationHours),
    'regeneration-time': String(snapshot.regenerationTimeHours),
  })
  return drafts
}

function Badge({ sourceType }: { sourceType: ParameterSourceType }) {
  return <span className={`scenario-status ${sourceType}`}>{sourceTypeLabel(sourceType)}</span>
}

function ParameterInput({ id, label, unit, drafts, errors, onChange }: {
  id: string; label: string; unit: string; drafts: Drafts; errors: Record<string, string>; onChange: (id: string, value: string) => void
}) {
  const parameter = getParameter(id)
  const error = errors[id]
  const rule = scenarioValidationRules[id]
  return <label className={`scenario-field${error ? ' has-error' : ''}`}>
    <span className="scenario-field-label">{label}<Badge sourceType={parameter?.sourceType ?? 'assumption'} /></span>
    <span className="scenario-input-wrap"><input type="number" inputMode="decimal" step="any" min={rule?.min} max={rule?.max} value={drafts[id] ?? ''} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={(event) => onChange(id, event.target.value)} /><small>{unit}</small></span>
    {error && <span className="scenario-error" id={`${id}-error`}>{error || rule?.message}</span>}
  </label>
}

function SourceSelect({ id, label, drafts, onChange }: { id: keyof typeof sourceOptions; label: string; drafts: Drafts; onChange: (id: string, value: string) => void }) {
  const parameter = getParameter(id)
  return <label className="scenario-field"><span className="scenario-field-label">{label}<Badge sourceType={parameter?.sourceType ?? 'assumption'} /></span><select value={drafts[id] ?? ''} onChange={(event) => onChange(id, event.target.value)}>{sourceOptions[id].map((option) => <option key={option} value={option}>{option}</option>)}{drafts[id] && !sourceOptions[id].includes(drafts[id]) && <option value={drafts[id]}>{drafts[id]}</option>}</select></label>
}

function SectionTitle({ number, title, action }: { number: number; title: string; action?: ReactNode }) {
  return <div className="scenario-section-title"><span className="scenario-number">{number}</span><h2>{title}</h2>{action && <div className="scenario-section-action">{action}</div>}</div>
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0)
}

function ChartCard({ title, kind, result }: { title: string; kind: 'emissions' | 'efficiency' | 'energy'; result: ScenarioResult }) {
  const width = 360
  const height = 156
  const pad = { top: 10, right: 8, bottom: 27, left: 35 }
  const plotWidth = width - pad.left - pad.right
  const plotHeight = height - pad.top - pad.bottom
  const points = result.samples
  const plottedValues = points.flatMap((point) => kind === 'emissions' ? [point.baselineEmissionsT, point.treatedEmissionsT] : [kind === 'efficiency' ? point.captureEfficiency : point.energyMWh])
  const maxValue = Math.max(1, ...plottedValues)
  const minValue = kind === 'emissions' ? 0 : Math.min(...plottedValues)
  const spread = Math.max(maxValue - minValue, maxValue * 0.01, 0.01)
  const domainMin = kind === 'emissions' ? 0 : Math.max(0, minValue - spread * 0.18)
  const domainMax = kind === 'emissions' ? maxValue : maxValue + spread * 0.18
  const y = (value: number) => pad.top + plotHeight - (value - domainMin) / Math.max(0.001, domainMax - domainMin) * plotHeight
  const x = (index: number) => pad.left + (points.length < 2 ? plotWidth / 2 : index / (points.length - 1) * plotWidth)
  const linePath = (value: (point: ScenarioResult['samples'][number]) => number) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(value(point))}`).join(' ')
  const labelIndices = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])]
  const unit = kind === 'emissions' ? 't CO₂' : kind === 'efficiency' ? '%' : 'MWh'
  return <article className="scenario-chart-card">
    <div className="scenario-chart-header"><h3>{title}</h3><span>{unit}</span></div>
    <svg className="scenario-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title} over ${result.period}`}>
      {[0, 0.5, 1].map((fraction) => { const tick = domainMax - (domainMax - domainMin) * fraction; return <g key={fraction}><line x1={pad.left} x2={width - pad.right} y1={pad.top + plotHeight * fraction} y2={pad.top + plotHeight * fraction} className="chart-gridline" /><text x={pad.left - 5} y={pad.top + plotHeight * fraction + 3} textAnchor="end" className="chart-axis-label">{formatNumber(tick, kind === 'efficiency' && tick < 1 ? 2 : 1)}</text></g> })}
      {kind === 'emissions' ? <g>{points.map((point, index) => {
        const groupWidth = Math.max(3, plotWidth / points.length * 0.58)
        const barWidth = Math.max(1, groupWidth / 2 - 1)
        const baseX = x(index) - groupWidth / 2
        return <g key={point.label}><rect x={baseX} y={y(point.baselineEmissionsT)} width={barWidth} height={pad.top + plotHeight - y(point.baselineEmissionsT)} rx="1" className="chart-bar baseline" /><rect x={baseX + barWidth + 2} y={y(point.treatedEmissionsT)} width={barWidth} height={pad.top + plotHeight - y(point.treatedEmissionsT)} rx="1" className="chart-bar treated" /></g>
      })}</g> : <>
        <path d={linePath((point) => kind === 'efficiency' ? point.captureEfficiency : point.energyMWh)} className={`chart-line ${kind}`} />
        {kind === 'energy' && points.map((point, index) => point.regenerationEnergyMWh > 0 ? <circle key={point.label} cx={x(index)} cy={y(point.energyMWh)} r="2.2" className="chart-event-marker" /> : null)}
      </>}
      {labelIndices.map((index) => <text key={`${index}-${points[index]?.label}`} x={x(index)} y={height - 8} textAnchor="middle" className="chart-axis-label">{points[index]?.label.replace('Day ', 'D').replace('Month ', 'M')}</text>)}
    </svg>
    <div className="scenario-chart-legend">{kind === 'emissions' ? <><span><i className="baseline" />Baseline</span><span><i className="treated" />With chitosan</span></> : kind === 'energy' ? <><span><i className="energy" />Energy use</span><span><i className="regeneration" />Regeneration</span></> : <span><i className={kind} />Capture efficiency</span>}</div>
  </article>
}

function makeSnapshot(drafts: Drafts): ScenarioSnapshot {
  return {
    industry: drafts.industry,
    emissionSource: drafts['emission-source'],
    site: drafts.site,
    co2Concentration: Number(drafts['feed-co2-concentration']),
    flowRate: Number(drafts['feed-flow-rate']),
    temperature: Number(drafts['feed-temperature']),
    pressure: Number(drafts['feed-pressure']),
    humidity: Number(drafts['feed-humidity']),
    so2: Number(drafts['feed-so2']),
    nox: Number(drafts['feed-nox']),
    particulates: Number(drafts['feed-particulates']),
    adsorptionTemperature: Number(drafts['adsorption-temperature']),
    adsorbentMass: Number(drafts['adsorbent-mass']),
    workingCapacity: Number(drafts['adsorption-capacity']),
    regenerationTemperature: Number(drafts['regeneration-temperature']),
    cycleDurationHours: Number(drafts['cycle-duration']),
    regenerationTimeHours: Number(drafts['regeneration-time']),
  }
}

function ScenarioAnalysisPage() {
  useSyncExternalStore(subscribeToParameters, getParameterRevision, getParameterRevision)
  const [drafts, setDrafts] = useState<Drafts>(() => {
    const active = getActiveScenarioResult()
    return active ? draftsFromSnapshot(active.snapshot) : formattedInitialDrafts()
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [period, setPeriod] = useState<ScenarioPeriod>(() => getActiveScenarioResult()?.period ?? 'monthly')
  const [result, setResult] = useState<ScenarioResult | null>(() => getActiveScenarioResult())
  const [sourceOpen, setSourceOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [runError, setRunError] = useState('')

  function changeDraft(id: string, value: string) {
    setDrafts((current) => ({ ...current, [id]: value }))
    setDirty(true)
  }

  async function runWithSnapshot(snapshot: ScenarioSnapshot, selectedPeriod: ScenarioPeriod) {
    setRunning(true)
    await new Promise((resolve) => window.setTimeout(resolve, 16))
    try {
      const nextResult = runScenario(snapshot, selectedPeriod)
      setResult(nextResult)
      setActiveScenarioResult(nextResult)
      setDirty(false)
      setRunError('')
    } catch {
      setRunError('The simulation could not be completed. Check the inputs and try again.')
    } finally {
      setRunning(false)
    }
  }

  async function submitScenario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateScenarioDrafts(drafts)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    await runWithSnapshot(makeSnapshot(drafts), period)
  }

  async function changePeriod(value: ScenarioPeriod) {
    setPeriod(value)
    if (result && !dirty) await runWithSnapshot(result.snapshot, value)
  }

  const material = getParameter('adsorbent-material')?.value ?? 'CS-TEPA-700'
  const sourceStatus = (id: string): ParameterSourceType => getParameter(id)?.sourceType ?? 'assumption'

  return <div className="dashboard-shell scenario-page">
    <Header page="scenario" title="Scenario Analysis" subtitle="Configure input parameters and run simulations" />
    <main className="dashboard-main scenario-main">
      <form className="scenario-form" onSubmit={submitScenario} noValidate>
        <section className="scenario-section panel">
          <SectionTitle number={1} title="Emission Source" />
          <div className="scenario-source-grid">
            <SourceSelect id="industry" label="Industry" drafts={drafts} onChange={changeDraft} />
            <SourceSelect id="emission-source" label="Emission source type" drafts={drafts} onChange={changeDraft} />
            <SourceSelect id="site" label="Site" drafts={drafts} onChange={changeDraft} />
          </div>
        </section>

        <section className="scenario-section panel">
          <SectionTitle number={2} title="Feed Gas Conditions (at source)" />
          <div className="scenario-input-grid">
            {numericFields.slice(0, 8).map((field) => <ParameterInput key={field.id} {...field} drafts={drafts} errors={errors} onChange={changeDraft} />)}
          </div>
        </section>

        <section className="scenario-section panel">
          <SectionTitle number={3} title={`Chitosan Capture Unit (${material})`} action={<button type="button" className="scenario-material-link" onClick={() => setSourceOpen(true)}>View material details <span>→</span></button>} />
          <div className="scenario-input-grid capture-input-grid">
            {numericFields.slice(8).map((field) => <ParameterInput key={field.id} {...field} drafts={drafts} errors={errors} onChange={changeDraft} />)}
          </div>
          <div className="working-capacity-note"><Badge sourceType={sourceStatus('adsorption-capacity')} /><span>Scenario working capacity is an assumed process input. Material details show CS-TEPA-700 research as a reference; those values are not verified for the fixed XS-TEPA-700 material and do not set this working capacity.</span></div>
        </section>

        {runError && <div className="scenario-run-error" role="alert">{runError}</div>}
        <section className="scenario-run-section">
          <div><SectionTitle number={4} title="Run Simulation" /><p>Run the existing process model with this scenario snapshot.</p></div>
          <button className="scenario-run-button" type="submit" disabled={running}>{running ? 'Calculating…' : 'Run and Analyse Scenario'}<span>→</span></button>
        </section>
      </form>

      <section className="scenario-results" aria-live="polite">
        <div className="scenario-results-heading"><div><SectionTitle number={5} title="Scenario Results" /><p>{result ? `${result.snapshot.industry} · ${result.snapshot.emissionSource} · ${result.snapshot.site}` : 'Calculated output from the current scenario inputs'}</p></div><label className="period-select">Period<select value={period} onChange={(event) => void changePeriod(event.target.value as ScenarioPeriod)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label></div>
        {dirty && result && <div className="scenario-stale-note">Inputs changed. Run the scenario to refresh these results.</div>}
        <div className="scenario-kpi-grid">
          <article className="scenario-kpi"><span>CO₂ captured</span><strong>{result ? `${formatNumber(result.capturedTonnes)} t` : '—'}</strong><small>{period[0].toUpperCase() + period.slice(1)}</small></article>
          <article className="scenario-kpi"><span>Emission reduction</span><strong>{result ? `${formatNumber(result.emissionReduction, 1)}%` : '—'}</strong><small>CO₂ captured / input</small></article>
          <article className="scenario-kpi"><span>Energy use</span><strong>{result ? `${formatNumber(result.energyMWh)} MWh` : '—'}</strong><small>Process model estimate</small></article>
          <article className="scenario-kpi"><span>Energy per tCO₂</span><strong>{result ? `${formatNumber(result.energyPerTonne)} kWh/t` : '—'}</strong><small>Net captured CO₂</small></article>
        </div>
        {result ? <div className="scenario-chart-grid"><ChartCard title="CO₂ Emissions" kind="emissions" result={result} /><ChartCard title="Capture Efficiency" kind="efficiency" result={result} /><ChartCard title="Energy Consumption" kind="energy" result={result} /></div> : <div className="scenario-chart-empty">Run the scenario to calculate emissions, capture efficiency and energy charts.</div>}
        <p className="scenario-result-note">Scenario outputs are simulated estimates based on the displayed inputs and engineering assumptions. They are not measured plant data.</p>
      </section>
    </main>
    {sourceOpen && <SourceDetailsDialog sourceId="SRC-CS-TEPA-700-2026" onClose={() => setSourceOpen(false)} />}
    <footer className="app-footer"><span>CHITOCAPTURE <b>·</b> SCENARIO ANALYSIS</span><span>SIMULATION ESTIMATES <i /></span></footer>
  </div>
}

export default ScenarioAnalysisPage
