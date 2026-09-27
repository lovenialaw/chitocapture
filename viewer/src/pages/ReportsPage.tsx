import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Header from '../components/Header'
import { getActiveScenarioResult, subscribeToActiveScenario } from '../simulation/activeScenario'
import { getCurrentScenarioSnapshot, runScenario } from '../simulation/scenarioRunner'
import type { ScenarioPeriod } from '../simulation/scenarioRunner'
import { createReportSnapshot, getAvailableReportPeriods } from '../simulation/reportSnapshot'
import type { ReportSnapshot, ReportType } from '../simulation/reportSnapshot'
import { createReportPdf } from '../simulation/reportPdf'
import { getAllSources } from '../data/sources'
import { formatMalaysiaDateTime } from '../utils/malaysiaTime'

const contents = [
  'Executive Summary', 'Source Configuration', 'Feed Gas Conditions', 'Capture System Configuration',
  'Emissions Performance', 'CO₂ Capture Performance', 'Energy Analysis', 'Carbon Flow & Destination',
  'Operating Performance', 'Data Quality & Sources', 'Methodology & Assumptions', 'Model Limitations',
  'Appendix A — Parameter Registry', 'Appendix B — Source Register', 'Appendix C — Simulation Configuration',
  'Appendix D — Calculation Definitions', 'Appendix E — Data Completeness', 'Appendix F — Validation Checklist',
]

function format(value: number, digits = 1) {
  return Number.isFinite(value) ? new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value) : 'Not available'
}

function reportTypeLabel(type: ReportType) { return type === 'yearly' ? 'Annual' : type === 'quarterly' ? 'Quarterly' : 'Monthly' }

function previewRows(report: ReportSnapshot, section: string): Array<[string, string]> {
  const k = report.calculatedKPIs
  const fmtValue = (value: number, unit = '') => `${format(value)}${unit ? ` ${unit}` : ''}`
  switch (section) {
    case 'Executive Summary': return [['CO₂ captured', fmtValue(k.capturedTonnes, 't')], ['Capture efficiency', fmtValue(k.captureEfficiency, '%')], ['Energy', fmtValue(k.totalEnergyMWh, 'MWh')], ['Data status', 'SIMULATED']]
    case 'Source Configuration': return [['Industry', report.scenario.industry], ['Emission source', report.scenario.emissionSource], ['Site', report.scenario.site], ['Scenario ID', report.scenarioId]]
    case 'Feed Gas Conditions':
    case 'Capture System Configuration': {
      const category = section === 'Feed Gas Conditions' ? 'FEED GAS CONDITIONS' : 'CHITOSAN CAPTURE UNIT'
      return report.parameterSnapshot.filter((parameter) => parameter.category === category).slice(0, 8).map((parameter) => [parameter.name, `${parameter.value}${parameter.unit ? ` ${parameter.unit}` : ''} · ${parameter.sourceType.toUpperCase()}`])
    }
    case 'Emissions Performance': return [['Baseline emissions', fmtValue(k.baselineEmissions, 't CO₂')], ['With-capture emissions', fmtValue(k.treatedEmissions, 't CO₂')], ['Reduction', `${format(k.emissionReductionPercent, 2)}%`]]
    case 'CO₂ Capture Performance': return [['Input', fmtValue(k.inputTonnes, 't CO₂')], ['Captured', fmtValue(k.capturedTonnes, 't CO₂')], ['Remaining', fmtValue(k.remainingTonnes, 't CO₂')], ['Balance', report.validationResults.massBalanceOk ? 'PASS' : 'CHECK']]
    case 'Energy Analysis': return [['Total', fmtValue(k.totalEnergyMWh, 'MWh')], ['Intensity', fmtValue(k.energyIntensityKWhPerTonne, 'kWh/t CO₂')], ['Daily average', fmtValue(k.averageDailyKWh, 'kWh/day')], ['Components', report.validationResults.energyBalanceOk ? 'Reconciled' : 'Check']]
    case 'Carbon Flow & Destination': return [['Captured stream', 'Storage/utilisation destination not verified'], ['Treated gas', 'To stack · simulated'], ['CO₂ balance', report.validationResults.massBalanceOk ? 'PASS' : 'CHECK']]
    case 'Operating Performance': return [['Samples', String(report.timeSeriesSummary.sampleCount)], ['Efficiency range', `${format(k.minimumCaptureEfficiency, 2)}–${format(k.maximumCaptureEfficiency, 2)}%`], ['Cycle count / loading', 'Not available in current model output']]
    case 'Data Quality & Sources': return [['Literature', String(report.provenanceCounts.literature)], ['Assumed', String(report.provenanceCounts.assumption)], ['Simulated', String(report.provenanceCounts.simulated)], ['Measured', String(report.provenanceCounts.measured)], ['Completeness', `${report.dataCompleteness.percent}%`]]
    case 'Methodology & Assumptions': return [['CO₂ captured', 'Input − treated emissions'], ['Capture efficiency', 'Captured / input × 100%'], ['Energy intensity', 'Energy / captured CO₂'], ['Assumptions', `${report.assumptions.length} registry entries`]]
    case 'Model Limitations': return [['Measured data', 'None registered'], ['Product carbon intensity', 'Not available'], ['Storage permanence', 'Not confirmed'], ['Independent verification', 'Not provided']]
    case 'Appendix A — Parameter Registry': return [['Registry entries', String(report.parameterSnapshot.length)], ['Provenance', 'ID · value · category · status · source']]
    case 'Appendix B — Source Register': return [['Sources', String(report.sourceSnapshot.length)], ['Verified literature', String(report.provenanceCounts.literature)], ['Unverified placeholders', 'Clearly identified in source register']]
    case 'Appendix C — Simulation Configuration': return [['Scenario ID', report.scenarioId], ['Period', report.reportingPeriod.label], ['Time steps', String(report.timeSeriesSummary.sampleCount)]]
    case 'Appendix D — Calculation Definitions': return [['Mass balance', report.validationResults.massBalanceOk ? 'PASS' : 'CHECK'], ['Energy balance', report.validationResults.energyBalanceOk ? 'PASS' : 'CHECK']]
    case 'Appendix E — Data Completeness': return [['Registry completeness', `${report.dataCompleteness.count}/${report.dataCompleteness.total} (${report.dataCompleteness.percent}%)`], ['Time series', `${report.timeSeriesSummary.start} – ${report.timeSeriesSummary.end}`]]
    default: return [['Validation', report.validationResults.massBalanceOk && report.validationResults.energyBalanceOk ? 'Balances pass' : 'Review checks'], ['Time series', report.validationResults.timeSeriesComplete ? 'Complete' : 'Partial']]
  }
}

function ReportCover({ report }: { report: ReportSnapshot | null }) {
  return <article className="report-cover" aria-label="Report cover preview">
    <div className="report-cover-top"><span className="report-brand-mark">C</span><span>ChitoCapture</span></div>
    <p className="report-cover-eyebrow">CARBON CAPTURE PERFORMANCE REPORT</p>
    <h3>Carbon Capture<br />Performance Report</h3>
    <div className="report-cover-rule" />
    <dl>
      <div><dt>Report type</dt><dd>{report ? reportTypeLabel(report.reportType) : 'Monthly'}</dd></div>
      <div><dt>Reporting period</dt><dd>{report?.reportingPeriod.label ?? 'Select a period'}</dd></div>
      <div><dt>Industry</dt><dd>{report?.scenario.industry ?? '—'}</dd></div>
      <div><dt>Emission source</dt><dd>{report?.scenario.emissionSource ?? '—'}</dd></div>
      <div><dt>Site</dt><dd>{report?.scenario.site ?? '—'}</dd></div>
    </dl>
    <div className="report-cover-status"><i /> SIMULATION-BASED MODEL</div>
    <small>{report ? `Generated ${formatMalaysiaDateTime(report.generatedAt)} MYT` : 'Generate report to create a fixed snapshot'}</small>
    {report && <small className="report-id">{report.reportId}</small>}
  </article>
}

function ReportsPage() {
  const active = useSyncExternalStore(subscribeToActiveScenario, getActiveScenarioResult, getActiveScenarioResult)
  const [tab, setTab] = useState<'reports' | 'mrv'>('reports')
  const [reportType, setReportType] = useState<ReportType>('monthly')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [report, setReport] = useState<ReportSnapshot | null>(null)
  const [selectedSection, setSelectedSection] = useState(contents[0])
  const [error, setError] = useState('')
  const scenario = useMemo(() => active?.snapshot ?? getCurrentScenarioSnapshot(), [active])
  const annualResult = useMemo(() => active?.period === 'yearly' ? active : runScenario(scenario, 'yearly' as ScenarioPeriod), [active, scenario])
  const periodOptions = useMemo(() => getAvailableReportPeriods(annualResult.dailySamples, reportType), [annualResult, reportType])
  const period = periodOptions.find((item) => item.key === selectedPeriod) ?? periodOptions[0]

  useEffect(() => {
    if (!periodOptions.some((item) => item.key === selectedPeriod)) {
      const configuredStart = new Date(annualResult.dailySamples[0]?.timestamp ?? Date.now())
      const preferredKey = reportType === 'monthly'
        ? `${configuredStart.getUTCFullYear()}-${String(configuredStart.getUTCMonth() + 1).padStart(2, '0')}`
        : reportType === 'quarterly'
          ? `${configuredStart.getUTCFullYear()}-Q${Math.floor(configuredStart.getUTCMonth() / 3) + 1}`
          : String(configuredStart.getUTCFullYear())
      setSelectedPeriod(periodOptions.find((item) => item.key === preferredKey)?.key ?? periodOptions[0]?.key ?? '')
    }
  }, [annualResult, periodOptions, reportType, selectedPeriod])

  function generateReport() {
    if (!period) { setError('No simulation samples are available for this reporting period.'); return }
    try {
      setError('')
      const generated = createReportSnapshot(reportType, period, annualResult)
      if (!generated.samples.length) { setError('The selected period has no simulated daily samples.'); return }
      setReport(generated)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The report could not be generated.')
    }
  }

  function downloadPdf() {
    if (!report) return
    const blob = createReportPdf(report)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${report.reportId}-${report.reportingPeriod.key}.pdf`
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
  }

  const k = report?.calculatedKPIs
  return <div className="dashboard-shell reports-page">
    <Header page="reports" title="Reports" subtitle="Generate period-based performance and MRV-oriented reports" />
    <main className="dashboard-main reports-main">
      <div className="reports-tabs" role="tablist" aria-label="Report workspace">
        <button role="tab" aria-selected={tab === 'reports'} className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>REPORTS</button>
        <button role="tab" aria-selected={tab === 'mrv'} className={tab === 'mrv' ? 'active' : ''} onClick={() => setTab('mrv')}>MRV REPORTS</button>
      </div>
      <section className="report-controls panel" aria-label="Report period and type">
        <label><span>Select report type</span><select value={reportType} onChange={(event) => { setReportType(event.target.value as ReportType); setReport(null) }}><option value="monthly">Monthly Report</option><option value="quarterly">Quarterly Report</option><option value="yearly">Yearly Report</option></select></label>
        <label><span>Reporting period</span><select aria-label="Reporting period" value={period?.key ?? ''} onChange={(event) => { setSelectedPeriod(event.target.value); setReport(null) }}>{periodOptions.map((option) => <option key={option.key} value={option.key}>{option.label} ({option.start} – {option.end})</option>)}</select></label>
        <button type="button" className="report-generate" onClick={generateReport}>Generate Report</button>
      </section>
      {error && <p role="alert" className="report-error">{error}</p>}

      {tab === 'reports' ? <>
      <section className="report-preview panel">
        <div className="report-preview-heading"><div><h2>Contents Preview</h2><p>{report ? `Fixed snapshot · ${report.reportId}` : 'Generate a report snapshot, then select a section to preview.'}</p></div><span className="report-status-badge"><i /> SIMULATED DATA</span></div>
        <div className="report-preview-grid">
          <nav className="report-contents" aria-label="Report contents"><h3>Report contents</h3><ol>{contents.map((item) => <li key={item}><button type="button" aria-current={selectedSection === item ? 'true' : undefined} onClick={() => setSelectedSection(item)}><span>{item}</span><b>›</b></button></li>)}</ol></nav>
          <div className="report-details-column">
            <div className="report-cover-wrap"><ReportCover report={report} /><button className="report-download" disabled={!report} onClick={downloadPdf}><span aria-hidden="true">↓</span> Download PDF</button></div>
            {report ? <section className="report-section-preview" aria-live="polite"><h4>{selectedSection}</h4>{previewRows(report, selectedSection).map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</section> : <div className="report-section-empty">Generate a report to preview its contents and snapshot data.</div>}
          </div>
        </div>
      </section>
      {report && <section className="report-snapshot-summary panel" aria-label="Generated report snapshot summary">
          <div className="report-preview-heading"><div><h2>Snapshot Summary</h2><p>{report.reportId} · scenario {report.scenarioId} · {report.reportingPeriod.start} to {report.reportingPeriod.end}</p></div><span>{formatMalaysiaDateTime(report.generatedAt)} MYT</span></div>
          <div className="report-summary-kpis"><article><span>Baseline CO₂</span><strong>{format(k!.baselineEmissions)} t</strong></article><article><span>Captured</span><strong>{format(k!.capturedTonnes)} t</strong></article><article><span>Remaining</span><strong>{format(k!.remainingTonnes)} t</strong></article><article><span>Capture efficiency</span><strong>{format(k!.captureEfficiency, 2)}%</strong></article><article><span>Energy</span><strong>{format(k!.totalEnergyMWh)} MWh</strong></article></div>
          <div className="report-validation-row"><span>Mass balance <b className={report.validationResults.massBalanceOk ? 'pass' : 'fail'}>{report.validationResults.massBalanceOk ? 'PASS' : 'CHECK'}</b></span><span>Energy balance <b className={report.validationResults.energyBalanceOk ? 'pass' : 'fail'}>{report.validationResults.energyBalanceOk ? 'PASS' : 'CHECK'}</b></span><span>Data completeness <b>{report.dataCompleteness.percent}%</b></span><span>Source links <b>{report.validationResults.unresolvedSources.length ? 'CHECK' : 'RESOLVED'}</b></span><span>Invalid inputs <b>{report.validationResults.invalidParameters.length}</b></span></div>
          <p className="report-snapshot-lock">This report is a fixed snapshot. Later scenario changes will not alter these values.</p>
        </section>}
      </> : <MRVWorkspace report={report} onGenerate={generateReport} />}
      <footer className="app-footer"><span><i /> SIMULATION PROTOTYPE</span><span>{scenario.industry} · {scenario.emissionSource} · {scenario.site}</span><span>{active ? `${active.period} scenario samples` : 'Scenario prepared from parameter registry'}</span></footer>
    </main>
  </div>
}

function MRVWorkspace({ report, onGenerate }: { report: ReportSnapshot | null; onGenerate: () => void }) {
  const k = report?.calculatedKPIs
  const sources = getAllSources()
  return <section className="mrv-workspace">
    <div className="mrv-heading"><div><h2>MRV-Oriented Snapshot</h2><p>Monitoring · Reporting · Verification support summary</p></div><span>NOT A CERTIFIED MRV PLATFORM</span></div>
    <div className="mrv-summary-grid">
      <article className="panel"><h3>Monitoring</h3><p>Modeled process outputs with their provenance status.</p><dl><div><dt>CO₂ input</dt><dd>{k ? `${format(k.inputTonnes)} t · SIMULATED` : 'Generate a report'}</dd></div><div><dt>Captured / remaining</dt><dd>{k ? `${format(k.capturedTonnes)} / ${format(k.remainingTonnes)} t · SIMULATED` : '—'}</dd></div><div><dt>Energy</dt><dd>{k ? `${format(k.totalEnergyMWh)} MWh · SIMULATED` : '—'}</dd></div><div><dt>Adsorbent state</dt><dd>Not available in current report aggregation</dd></div><div><dt>Data completeness</dt><dd>{report ? `${report.dataCompleteness.percent}%` : '—'}</dd></div></dl></article>
      <article className="panel"><h3>Reporting</h3><p>Boundary and period included in the generated snapshot.</p><dl><div><dt>Reporting boundary</dt><dd>Configured flue gas CO₂ capture system</dd></div><div><dt>Reporting period</dt><dd>{report?.reportingPeriod.label ?? '—'}</dd></div><div><dt>Baseline / treated emissions</dt><dd>{k ? `${format(k.baselineEmissions)} / ${format(k.treatedEmissions)} tCO₂` : '—'}</dd></div><div><dt>Carbon intensity</dt><dd>Not available: product output not configured</dd></div></dl></article>
      <article className="panel"><h3>Verification Support</h3><p>Traceability checks; this prototype does not independently verify emissions.</p><dl><div><dt>Mass balance</dt><dd>{report ? (report.validationResults.massBalanceOk ? 'PASS' : 'CHECK') : '—'}</dd></div><div><dt>Energy balance</dt><dd>{report ? (report.validationResults.energyBalanceOk ? 'PASS' : 'CHECK') : '—'}</dd></div><div><dt>Parameter → source</dt><dd>{report ? `${report.parameters.length} registry entries · ${report.sources.length} sources` : '—'}</dd></div><div><dt>Missing values</dt><dd>{report ? report.validationResults.missingParameters.length : '—'}</dd></div><div><dt>Invalid values</dt><dd>{report ? report.validationResults.invalidParameters.length : '—'}</dd></div></dl></article>
    </div>
    {report && <section className="mrv-trace panel"><h3>Parameter → Source ID traceability</h3><div className="mrv-trace-list">{report.parameters.map((item) => <div key={item.id}><span>{item.name}</span><code>{item.sourceId}</code><b className={`source-status ${item.sourceType}`}>{item.sourceType.toUpperCase()}</b></div>)}</div><h3>Registered literature sources</h3>{sources.filter((source) => source.sourceType === 'literature').map((source) => <p key={source.sourceId}>{source.sourceId} · {source.title} · {source.reference}</p>)}{!sources.some((source) => source.sourceType === 'literature') && <p>No verified literature sources are registered.</p>}</section>}
    <div className="mrv-actions"><p>MRV-oriented support summary. This view is not certification or independent verification.</p><button onClick={onGenerate}>Generate MRV Snapshot</button></div>
  </section>
}

export default ReportsPage
