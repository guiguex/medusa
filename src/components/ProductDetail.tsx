// src/components/ProductDetail.tsx
import { useState, useEffect } from 'react'
import { ArrowLeft, ShoppingCart, Package, Settings, Star, Truck, Shield, RotateCcw } from 'lucide-react'
import { BabylonViewer } from './BabylonViewer'
import { PartsTab } from './tabs/PartsTab'
import { OptionsTab } from './tabs/OptionsTab'
import type { Product } from '../types'
// IMPORTANT: évite l'alias "@" si tu as déjà eu des soucis — import RELATIF
import { viewerBridge } from '../viewer/bridge'

// Props: 2 args pour onAddToCart (product, quantity), comme tu l’appelles plus bas
interface ProductDetailProps {
  product: Product
  onBack: () => void
  onAddToCart: (product: Product, quantity: number) => void
}

export function ProductDetail({ product, onBack, onAddToCart }: ProductDetailProps) {
  const [activeTab, setActiveTab] = useState<'parts' | 'options'>('parts')
  const [mode, setMode] = useState<'3d' | 'image'>('3d')
  const [selectedParts, setSelectedParts] = useState<string[]>([])
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)

  // Uniformise le chemin du GLB: accepte product.model3d OU product.modelPath
  const glb = (product as any).model3d ?? (product as any).modelPath ?? null

  const calculateTotalPrice = () => {
    let total = product.price

    // Add selected parts price
    selectedParts.forEach(partId => {
      const part = product.parts.find(p => p.id === partId)
      if (part) total += part.price
    })

    // Add selected options price
    selectedOptions.forEach(optionId => {
      const option = product.options.find(o => o.id === optionId)
      if (option) total += option.priceModifier
    })

    return total * quantity
  }

  const handleAddToCart = () => {
    const customizedProduct = {
      ...product,
      selectedParts,
      selectedOptions,
      customPrice: calculateTotalPrice() / quantity,
    } as Product & {
      selectedParts: string[]
      selectedOptions: string[]
      customPrice: number
    }
    onAddToCart(customizedProduct, quantity)
  }

  const tabs = [
    { id: 'parts' as const, label: 'Pièces', icon: Package, count: product.parts.length },
    { id: 'options' as const, label: 'Options', icon: Settings, count: product.options.length },
  ]

  // Informe le viewer du produit chargé (+ convention *_meta.json)
  useEffect(() => {
    const meta = glb ? String(glb).replace(/\.glb($|\?)/i, '_meta.json$1') : undefined
    viewerBridge.load(product.id, glb || undefined, meta)
  }, [product, glb])

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-8 transition-all duration-200 hover:translate-x-1"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Retour aux produits</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Colonne MEDIA */}
        <div className="space-y-6">
          {/* Mini switch 3D / IMG */}
          <div className="flex items-center justify-end">
            <div className="inline-flex border rounded overflow-hidden">
              <button
                className={`px-3 py-1 text-xs ${mode === '3d' ? 'bg-gray-900 text-white' : ''}`}
                onClick={() => { setMode('3d'); viewerBridge.setViewMode('3d') }}
                title="Voir en 3D"
              >3D</button>
              <button
                className={`px-3 py-1 text-xs ${mode === 'image' ? 'bg-gray-900 text-white' : ''}`}
                onClick={() => { setMode('image'); viewerBridge.setViewMode('image') }}
                title="Voir l’image"
              >IMG</button>
            </div>
          </div>

          <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
            {mode === '3d' && glb ? (
              <BabylonViewer modelPath={glb} />
            ) : (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Truck className="w-4 h-4 text-green-600" />
              <span>Livraison gratuite</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Garantie 2 ans</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <RotateCcw className="w-4 h-4 text-purple-600" />
              <span>Retour 30j</span>
            </div>
          </div>
        </div>

        {/* Colonne DETAILS */}
        <div className="space-y-6">
          <div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold text-sm uppercase tracking-wide">
              {product.category}
            </span>
            <div className="flex items-center space-x-2 mt-1 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-600">(4.8/5 - 127 avis)</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">
              {product.name}
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-700">Prix total</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {calculateTotalPrice().toLocaleString('fr-FR')} €
              </span>
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <label className="text-sm font-medium text-gray-700">Quantité:</label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-l-lg transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 bg-white border-x border-gray-300 min-w-[60px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-r-lg transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Ajouter au panier</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-t pt-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6">
              {tabs.map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      active ? 'bg-white text-blue-600 shadow-md transform scale-105' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${active ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="min-h-[300px]">
              {activeTab === 'parts' && (
                <PartsTab
                  parts={product.parts}
                  partGroups={product.partGroups}
                  selectedParts={selectedParts}
                  onSelectionChange={setSelectedParts}
                />
              )}
              {activeTab === 'options' && (
                <OptionsTab
                  options={product.options}
                  optionGroups={product.optionGroups}
                  selectedOptions={selectedOptions}
                  onSelectionChange={setSelectedOptions}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
