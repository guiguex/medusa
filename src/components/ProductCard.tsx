import { ShoppingCart, Eye } from 'lucide-react'
import type { Product } from '../types'

type Props = {
  product: Product
  onSelect: (p: Product) => void
  onAddToCart: (p: Product, quantity?: number) => void
}

export function ProductCard({ product, onSelect, onAddToCart }: Props) {
  return (
    <div className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="aspect-video bg-gray-100">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      </div>

      <div className="p-4 space-y-2">
        <div className="text-sm text-gray-500">{product.category}</div>
        <h3 className="text-lg font-semibold leading-tight">{product.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xl font-bold">{product.price.toLocaleString('fr-FR')} €</div>
          <div className="flex gap-2">
            <button
              onClick={() => onSelect(product)}
              className="px-3 py-2 border rounded-lg flex items-center gap-2"
              aria-label="Voir la fiche produit"
            >
              <Eye className="w-4 h-4" />
              Détails
            </button>
            <button
              onClick={() => onAddToCart(product, 1)}
              className="px-3 py-2 bg-black text-white rounded-lg flex items-center gap-2"
              aria-label="Ajouter au panier"
            >
              <ShoppingCart className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
