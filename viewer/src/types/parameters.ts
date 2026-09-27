export type ParameterCategory =
  | 'SOURCE CONFIGURATION'
  | 'FEED GAS CONDITIONS'
  | 'CHITOSAN CAPTURE UNIT'
  | 'SIMULATION CONFIGURATION'
  | 'PHYSICAL CONSTANTS'

export type ParameterSourceType = 'literature' | 'assumption' | 'simulated'
export type ParameterStatus = 'active' | 'needs-verification' | 'prototype'
export type ParameterValue = string | number

export type ModelParameter = {
  id: string
  name: string
  value: ParameterValue
  unit: string
  category: ParameterCategory
  sourceType: ParameterSourceType
  sourceId: string
  editable: boolean
  status: ParameterStatus
}

export type DataSource = {
  sourceId: string
  title: string
  sourceType: ParameterSourceType
  publisher: string
  year: number | null
  reference: string
  url?: string
  notes: string
}
