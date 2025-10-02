export type Part = {
  id: string
  name: string
  price: number
  image?: string
  description?: string
  inStock?: boolean
  groupId?: string
}

export type PartGroup = {
  id: string
  name: string
  description?: string
  // IMPORTANT: PartsTab attend un tableau "parts" d'IDs
  parts: string[]
}

export type Option = {
  id: string
  name: string
  priceModifier: number
  image?: string
  description?: string
  value?: string | number
  groupId?: string
}

export type OptionGroup = {
  id: string
  name: string
  description?: string
  // IMPORTANT: OptionsTab attend "type" ('single' | 'multiple') et "options" d'IDs
  type: 'single' | 'multiple'
  options: string[]
}

export type Product = {
  id: string
  name: string
  slug?: string
  description: string
  category: string
  image: string
  model3d?: string
  price: number
  parts: Part[]
  partGroups: PartGroup[]
  options: Option[]
  optionGroups: OptionGroup[]
}

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  // métadonnées config
  selectedParts?: string[]
  selectedOptions?: string[]
  customPrice?: number
}
