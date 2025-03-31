export interface ModelData {
  name: string
  provider: string
  logoUrl?: string
  capabilities: string[]
  inputPrice: string
  outputPrice: string
  popular: boolean
  legacy: boolean
  alternativeProviders: {
    name: string
    inputPrice: string
    outputPrice: string
  }[]
}