import { readNumberParameter, readStringParameter, updateParameter } from '../data/parameters'
import { advanceProcessState, createInitialProcessState } from './processEngine'

export type ScenarioPeriod = 'weekly' | 'monthly' | 'yearly'

export type ScenarioSnapshot = {
  industry: string
  emissionSource: string
  site: string
  co2Concentration: number
  flowRate: number
  temperature: number
  pressure: number
  humidity: number
  so2: number
  nox: number
  particulates: number
  adsorptionTemperature: number
  adsorbentMass: number
  workingCapacity: number
  regenerationTemperature: number
  cycleDurationHours: number
  regenerationTimeHours: number
}

export type ScenarioSample = {
  label: string
  timestamp: string
  baselineEmissionsT: number
  treatedEmissionsT: number
  captureEfficiency: number
  energyMWh: number
  regenerationEnergyMWh: number
  gasHandlingEnergyMWh: number
  coolingEnergyMWh: number
  auxiliariesEnergyMWh: number
}

export type ScenarioResult = {
  period: ScenarioPeriod
  snapshot: ScenarioSnapshot
  inputTonnes: number
  capturedTonnes: number
  remainingTonnes: number
  emissionReduction: number
  energyMWh: number
  energyPerTonne: number
  samples: ScenarioSample[]
  dailySamples: ScenarioSample[]
  hourlySamples: ScenarioSample[]
}

export function getCurrentScenarioSnapshot(): ScenarioSnapshot {
  return {
    industry: readStringParameter('industry'),
    emissionSource: readStringParameter('emission-source'),
    site: readStringParameter('site'),
    co2Concentration: readNumberParameter('feed-co2-concentration'),
    flowRate: readNumberParameter('feed-flow-rate'),
    temperature: readNumberParameter('feed-temperature'),
    pressure: readNumberParameter('feed-pressure'),
    humidity: readNumberParameter('feed-humidity'),
    so2: readNumberParameter('feed-so2'),
    nox: readNumberParameter('feed-nox'),
    particulates: readNumberParameter('feed-particulates'),
    adsorptionTemperature: readNumberParameter('adsorption-temperature'),
    adsorbentMass: readNumberParameter('adsorbent-mass'),
    workingCapacity: readNumberParameter('adsorption-capacity'),
    regenerationTemperature: readNumberParameter('regeneration-temperature'),
    cycleDurationHours: readNumberParameter('cycle-duration') / 60,
    regenerationTimeHours: readNumberParameter('regeneration-time') / 60,
  }
}

const periodSettings: Record<ScenarioPeriod, { days: number; samples: number; label: string }> = {
  weekly: { days: 7, samples: 7, label: 'Day' },
  monthly: { days: 30, samples: 30, label: 'Day' },
  yearly: { days: 365, samples: 12, label: 'Month' },
}

function applySnapshot(snapshot: ScenarioSnapshot): void {
  updateParameter('industry', snapshot.industry)
  updateParameter('emission-source', snapshot.emissionSource)
  updateParameter('site', snapshot.site)
  updateParameter('feed-co2-concentration', snapshot.co2Concentration)
  updateParameter('feed-flow-rate', snapshot.flowRate)
  updateParameter('feed-temperature', snapshot.temperature)
  updateParameter('feed-pressure', snapshot.pressure)
  updateParameter('feed-humidity', snapshot.humidity)
  updateParameter('feed-so2', snapshot.so2)
  updateParameter('feed-nox', snapshot.nox)
  updateParameter('feed-particulates', snapshot.particulates)
  updateParameter('adsorption-temperature', snapshot.adsorptionTemperature)
  updateParameter('adsorbent-mass', snapshot.adsorbentMass)
  updateParameter('adsorption-capacity', snapshot.workingCapacity)
  updateParameter('regeneration-temperature', snapshot.regenerationTemperature)
  updateParameter('cycle-duration', snapshot.cycleDurationHours * 60)
  updateParameter('regeneration-time', snapshot.regenerationTimeHours * 60)
}

export function runScenario(snapshot: ScenarioSnapshot, period: ScenarioPeriod): ScenarioResult {
  applySnapshot(snapshot)
  const setting = periodSettings[period]
  const stepSeconds = 15 * 60
  const totalSteps = Math.ceil(setting.days * 24 * 3_600 / stepSeconds)
  const stepsPerSample = totalSteps / setting.samples
  let state = createInitialProcessState()
  let previousSample = { input: 0, captured: 0, energy: 0, regenerationEnergy: 0, gasHandlingEnergy: 0, coolingEnergy: 0, auxiliariesEnergy: 0 }
  let previousDaily = { ...previousSample }
  let previousHourly = { ...previousSample }
  const samples: ScenarioSample[] = []
  const dailySamples: ScenarioSample[] = []
  const hourlySamples: ScenarioSample[] = []
  const stepsPerHour = 3_600 / stepSeconds
  const stepsPerDay = 24 * stepsPerHour

  function makeSample(current: typeof previousSample, previous: typeof previousSample, label: string, timestamp: string): ScenarioSample {
    const input = Math.max(0, current.input - previous.input)
    const captured = Math.min(input, Math.max(0, current.captured - previous.captured))
    const energy = Math.max(0, current.energy - previous.energy)
    return {
      label,
      timestamp,
      baselineEmissionsT: input / 1_000,
      treatedEmissionsT: Math.max(0, input - captured) / 1_000,
      captureEfficiency: input > 0 ? captured / input * 100 : 0,
      energyMWh: energy / 1_000,
      regenerationEnergyMWh: Math.min(energy, Math.max(0, current.regenerationEnergy - previous.regenerationEnergy)) / 1_000,
      gasHandlingEnergyMWh: Math.max(0, current.gasHandlingEnergy - previous.gasHandlingEnergy) / 1_000,
      coolingEnergyMWh: Math.max(0, current.coolingEnergy - previous.coolingEnergy) / 1_000,
      auxiliariesEnergyMWh: Math.max(0, current.auxiliariesEnergy - previous.auxiliariesEnergy) / 1_000,
    }
  }

  for (let index = 0; index < totalSteps; index += 1) {
    state = advanceProcessState(state, stepSeconds)
    const current = { input: state.carbon.co2Input, captured: state.carbon.co2Captured, energy: state.energy.totalEnergy, regenerationEnergy: state.energy.regenerationEnergy, gasHandlingEnergy: state.energy.gasHandlingEnergy, coolingEnergy: state.energy.coolingEnergy, auxiliariesEnergy: state.energy.auxiliariesEnergy }
    if ((index + 1) % stepsPerHour === 0 && hourlySamples.length < 24) {
      hourlySamples.push(makeSample(current, previousHourly, `${hourlySamples.length + 1}:00`, state.timestamp))
      previousHourly = current
    }
    if ((index + 1) % stepsPerDay === 0) {
      dailySamples.push(makeSample(current, previousDaily, `Day ${dailySamples.length + 1}`, state.timestamp))
      previousDaily = current
    }
    const sampleBoundary = Math.ceil((samples.length + 1) * stepsPerSample)
    if (index + 1 >= sampleBoundary) {
      samples.push(makeSample(current, previousSample, `${setting.label} ${samples.length + 1}`, state.timestamp))
      previousSample = current
    }
  }

  const capturedTonnes = samples.reduce((total, sample) => total + sample.baselineEmissionsT - sample.treatedEmissionsT, 0)
  const inputTonnes = samples.reduce((total, sample) => total + sample.baselineEmissionsT, 0)
  const remainingTonnes = Math.max(0, inputTonnes - capturedTonnes)
  const energyMWh = samples.reduce((total, sample) => total + sample.energyMWh, 0)
  return {
    period,
    snapshot: { ...snapshot },
    inputTonnes,
    capturedTonnes,
    remainingTonnes,
    emissionReduction: inputTonnes > 0 ? capturedTonnes / inputTonnes * 100 : 0,
    energyMWh,
    energyPerTonne: capturedTonnes > 0 ? energyMWh * 1_000 / capturedTonnes : 0,
    samples,
    dailySamples,
    hourlySamples,
  }
}
