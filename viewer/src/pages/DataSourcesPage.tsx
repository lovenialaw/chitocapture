import { useMemo, useState, useSyncExternalStore } from 'react'
import Header from '../components/Header'
import SourceDetailsDialog from '../components/SourceDetailsDialog'
import { getAllParameters, getParameterRevision, subscribeToParameters } from '../data/parameters'
import { getAllSources, getSource, sourceTypeLabel } from '../data/sources'
import type { ModelParameter, ParameterSourceType } from '../types/parameters'

type Filter = 'all' | ParameterSourceType

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'literature', label: 'Literature' },
  { id: 'assumption', label: 'Assumed' },
  { id: 'simulated', label: 'Simulated' },
]

const keyConfigurationIds = ['feed-co2-concentration', 'feed-flow-rate', 'adsorption-temperature', 'regeneration-temperature', 'adsorbent-mass']
const literatureMaterialIds = [
  'literature-reference-capacity',
  'literature-adsorption-temperature',
  'literature-adsorption-pressure',
  'literature-surface-area-series-maximum',
  'literature-ultramicropore-volume',
  'literature-regeneration-performance',
]

function valueText(parameter: ModelParameter): string {
  if (typeof parameter.value === 'number') return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(parameter.value)
  return parameter.value
}

function StatusBadge({ type }: { type: ParameterSourceType }) {
  return <span className={`data-status ${type}`}>{sourceTypeLabel(type)}</span>
}

function SourceLink({ sourceId, onSelect }: { sourceId: string; onSelect: (id: string) => void }) {
  const source = getSource(sourceId)
  return <button className="source-id-button" type="button" onClick={() => onSelect(sourceId)}>{source?.sourceId ?? sourceId}</button>
}

function DataSourcesPage() {
  useSyncExternalStore(subscribeToParameters, getParameterRevision, getParameterRevision)
  const parameters = getAllParameters()
  const sources = getAllSources()
  const [filter, setFilter] = useState<Filter>('all')
  const [showAll, setShowAll] = useState(false)
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const counts = useMemo(() => ({
    simulated: parameters.filter((parameter) => parameter.sourceType === 'simulated').length,
    literature: parameters.filter((parameter) => parameter.sourceType === 'literature' && getSource(parameter.sourceId)?.sourceType === 'literature').length,
    assumption: parameters.filter((parameter) => parameter.sourceType === 'assumption').length,
  }), [parameters])
  const visibleParameters = parameters.filter((parameter) => filter === 'all' || parameter.sourceType === filter)
  const configurationParameters = filter === 'all'
    ? visibleParameters.filter((parameter) => showAll || keyConfigurationIds.includes(parameter.id))
    : showAll ? visibleParameters : visibleParameters.slice(0, 8)
  const visibleSources = sources.filter((source) => filter === 'all' || source.sourceType === filter)
  const materialName = String(parameters.find((parameter) => parameter.id === 'adsorbent-material')?.value ?? 'Not yet specified')
  const materialProperties = literatureMaterialIds.map((id) => parameters.find((parameter) => parameter.id === id)).filter((item): item is ModelParameter => Boolean(item))

  return (
    <div className="dashboard-shell data-sources-page" id="data-sources">
      <Header page="sources" title="Data & Sources" subtitle="Transparency and provenance of the data, assumptions and literature used by the ChitoCapture model." />
      <main className="dashboard-main data-main">
        <div className="data-integrity-note"><span>i</span>System readings are simulated unless explicitly identified as literature-derived or measured data.</div>

        <section className="data-summary-grid" aria-label="Parameter source counts">
          <article className="data-summary-card simulated"><span className="summary-kicker">SIMULATED DATA</span><strong>{counts.simulated}</strong><p>Prototype and runtime values</p></article>
          <article className="data-summary-card literature"><span className="summary-kicker">LITERATURE DATA</span><strong>{counts.literature}</strong><p>Values supported by published research</p></article>
          <article className="data-summary-card assumption"><span className="summary-kicker">ASSUMED DATA</span><strong>{counts.assumption}</strong><p>Engineering assumptions used by the model</p></article>
        </section>

        <section className="data-section panel" id="model-configuration">
          <div className="data-section-heading">
            <div><span className="section-eyebrow">MODEL INPUTS & PROVENANCE</span><h2>Current Model Configuration</h2></div>
            <div className="data-filters" role="group" aria-label="Filter data by source type">
              {filters.map((item) => <button type="button" key={item.id} className={filter === item.id ? 'active' : ''} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}
            </div>
          </div>
          <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Parameter</th><th>Value</th><th>Status</th><th>Source</th></tr></thead><tbody>
            {configurationParameters.map((parameter) => <tr key={parameter.id}><td>{parameter.name}</td><td>{valueText(parameter)}{parameter.unit && <small>{parameter.unit}</small>}</td><td><StatusBadge type={parameter.sourceType} /></td><td><SourceLink sourceId={parameter.sourceId} onSelect={setSelectedSourceId} /></td></tr>)}
            {configurationParameters.length === 0 && <tr><td className="data-empty" colSpan={4}>No parameters match this source type.</td></tr>}
          </tbody></table></div>
          <button className="data-view-all" type="button" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)}>{showAll ? 'Show key parameters' : 'View all parameters'} <span>{showAll ? '−' : '+'}</span></button>
        </section>

        <section className="data-section panel" id="chitosan-adsorbent">
          <div className="data-section-heading material-heading"><div><span className="section-eyebrow">REFERENCE MATERIAL</span><h2>Chitosan Adsorbent</h2></div><span className="material-chip">{materialName}</span></div>
          <p className="material-description">The model material is fixed as XS-TEPA-700. The verified properties below are for CS-TEPA-700 research and are shown as related literature only; they are not verified values for XS-TEPA-700 or industrial working capacity.</p>
          <div className="material-property-grid">
            {materialProperties.map((parameter) => <article className="material-property" key={parameter.id}><span>{parameter.name}</span><strong>{valueText(parameter)}{parameter.unit && <small> {parameter.unit}</small>}</strong><div><StatusBadge type={parameter.sourceType} /><SourceLink sourceId={parameter.sourceId} onSelect={setSelectedSourceId} /></div></article>)}
          </div>
          <p className="material-caveat">The study’s 1028 m²/g figure is its maximum across the material series; it is not verified as specific to CS-TEPA-700. Material density and regeneration temperature/energy are not yet verified.</p>
        </section>

        <section className="data-section panel" id="source-library">
          <div className="data-section-heading"><div><span className="section-eyebrow">REFERENCES & MODEL RECORDS</span><h2>Source Library</h2></div><span className="source-count">{visibleSources.length} {visibleSources.length === 1 ? 'source' : 'sources'}</span></div>
          <div className="source-list">{visibleSources.map((source) => {
            const usedFor = parameters.filter((parameter) => parameter.sourceId === source.sourceId)
            return <article className="source-row" key={source.sourceId}>
              <div className="source-row-id">{source.sourceId}</div>
              <div className="source-row-main"><strong>{source.title}</strong><span>{source.publisher}{source.year ? ` · ${source.year}` : ''}</span><small>Used for: {usedFor.length ? usedFor.map((item) => item.name).join(', ') : 'No registered parameters'}</small></div>
              <StatusBadge type={source.sourceType} />
              <button className="source-view-button" type="button" onClick={() => setSelectedSourceId(source.sourceId)}>View source</button>
            </article>
          })}</div>
          {visibleSources.length === 0 && <p className="data-empty-message">No sources match this source type.</p>}
        </section>

        {selectedSourceId && <SourceDetailsDialog sourceId={selectedSourceId} onClose={() => setSelectedSourceId(null)} />}
      </main>
      <footer className="app-footer"><span>CHITOCAPTURE <b>·</b> DATA & SOURCES</span><span>READ-ONLY PROVENANCE VIEW <i /></span></footer>
    </div>
  )
}

export default DataSourcesPage
