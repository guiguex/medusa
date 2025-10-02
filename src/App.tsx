/**
 * src/App.tsx  —  version longue (>500 lignes), strictement compatible avec tes composants existants.
 *
 * Objectifs :
 *  - Ne pas toucher à tes autres fichiers (ProductCard, ProductDetail, Cart, Header, Toast, Tabs, BabylonViewer, products.ts).
 *  - Liste → Fiche → Panier, avec persistance LocalStorage.
 *  - Gestion recherche/tri/filtre (catégorie, prix min/max) intégrée.
 *  - Calcul de prix pour produit configuré (base + pièces + options) sans modifier ProductDetail.
 *  - Préparation synchro Medusa (facultative), mais sans dépendance externe ni autre fichier.
 *  - Compatible React ou Preact via preact/compat (alias dans vite.config.ts si tu l’utilises).
 *
 * Hypothèses d’intégration :
 *  - ProductCard: export nommé { ProductCard } avec props { product, onSelect, onAddToCart }.
 *  - ProductDetail: props { product, onBack, onAddToCart } et appelle onAddToCart(product, quantity).
 *  - Cart: props { items, onClose, onUpdateQuantity, onRemoveItem, onClearCart }.
 *  - Header: props { cartItemsCount, onCartClick }.
 *  - Toast: props { message, type, onClose }.
 *  - products: import { products } from './data/products'.
 *  - types: import type { Product, CartItem } from './types'.
 *
 * Tu remplaces uniquement ce fichier.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Header } from './components/Header'
import { ProductCard } from './components/ProductCard'
import { ProductDetail } from './components/ProductDetail'
import { Cart } from './components/Cart'
import { Toast } from './components/Toast'
import { products as staticProducts } from './data/products'
import type { Product, CartItem } from './types'

/* =======================================================================
   Utilitaires généraux
   ======================================================================= */

/** Clamp numérique simple */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/** Format prix FR */
function fmt(price: number) {
  try {
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' €'
  } catch {
    return `${price} €`
  }
}

/** Normalisation pour recherche plein-texte basique */
function normalize(str: string) {
  return (str || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
}

/** Deep clone JSON-safe */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/** Calcul prix d’un produit configuré (base + parts + options) */
function computeCustomizedPrice(p: Product): number {
  const base = p.price || 0

  const selectedParts: string[] = (p as any).selectedParts || []
  const selectedOptions: string[] = (p as any).selectedOptions || []

  const partsById = new Map(p.parts.map(x => [x.id, x]))
  const optionsById = new Map(p.options.map(x => [x.id, x]))

  const partsSum = selectedParts.reduce((s, id) => s + (partsById.get(id)?.price ?? 0), 0)
  const optionsSum = selectedOptions.reduce((s, id) => s + (optionsById.get(id)?.priceModifier ?? 0), 0)

  return Math.max(0, base + partsSum + optionsSum)
}

/** Totaux panier (sous-total, livraison, total) */
function computeCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shipping = subtotal > 100 ? 0 : (items.length > 0 ? 9.99 : 0)
  const total = subtotal + shipping
  return { subtotal, shipping, total }
}

/* =======================================================================
   LocalStorage (persistance)
   ======================================================================= */

const LS_CART = 'durabac_cart_items_v1'
const LS_PREFS = 'durabac_prefs_v1'
const LS_MEDUSA_CART = 'durabac_medusa_cart_id_v1'

type SortKey = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'category_asc' | 'category_desc'

type Prefs = {
  sort: SortKey
  category: string | 'ALL'
  q: string
  minPrice?: number
  maxPrice?: number
}

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(LS_CART)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeCart(items: CartItem[]) {
  try { localStorage.setItem(LS_CART, JSON.stringify(items)) } catch {}
}

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(LS_PREFS)
    if (!raw) return { sort: 'name_asc', category: 'ALL', q: '' }
    const p = JSON.parse(raw)
    return {
      sort: p.sort ?? 'name_asc',
      category: p.category ?? 'ALL',
      q: p.q ?? '',
      minPrice: p.minPrice ?? undefined,
      maxPrice: p.maxPrice ?? undefined
    }
  } catch {
    return { sort: 'name_asc', category: 'ALL', q: '' }
  }
}

function writePrefs(p: Prefs) {
  try { localStorage.setItem(LS_PREFS, JSON.stringify(p)) } catch {}
}

function readMedusaCartId(): string | null {
  try { return localStorage.getItem(LS_MEDUSA_CART) } catch { return null }
}
function writeMedusaCartId(id: string) {
  try { localStorage.setItem(LS_MEDUSA_CART, id) } catch {}
}

/* =======================================================================
   Tri / Filtre / Recherche
   ======================================================================= */

type Filters = {
  q: string
  category: string | 'ALL'
  minPrice?: number
  maxPrice?: number
}

function filterAndSortProducts(all: Product[], filters: Filters, sort: SortKey) {
  const qn = normalize(filters.q)
  let arr = all.filter(p => {
    const inCat = filters.category === 'ALL' || p.category === filters.category
    const inQ =
      !qn ||
      normalize(p.name).includes(qn) ||
      normalize(p.description).includes(qn) ||
      normalize(p.category || '').includes(qn)
    const aboveMin = filters.minPrice == null || p.price >= filters.minPrice!
    const belowMax = filters.maxPrice == null || p.price <= filters.maxPrice!
    return inCat && inQ && aboveMin && belowMax
  })

  arr.sort((a, b) => {
    switch (sort) {
      case 'name_asc': return a.name.localeCompare(b.name, 'fr')
      case 'name_desc': return b.name.localeCompare(a.name, 'fr')
      case 'price_asc': return a.price - b.price
      case 'price_desc': return b.price - a.price
      case 'category_asc': return (a.category || '').localeCompare(b.category || '', 'fr')
      case 'category_desc': return (b.category || '').localeCompare(a.category || '', 'fr')
      default: return 0
    }
  })
  return arr
}

/* =======================================================================
   Medusa (optionnel) — client minimal interne au fichier
   ======================================================================= */

type MedusaState = {
  enabled: boolean
  baseUrl?: string
  cartId?: string | null
  regionId?: string | null
}

async function medusaHttp<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base.replace(/\/+$/, '')}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Medusa ${res.status} ${res.statusText}: ${txt}`)
  }
  return res.json() as Promise<T>
}

async function medusaCreateCart(base: string, region_id?: string) {
  return medusaHttp<{ cart: any }>(base, '/store/carts', {
    method: 'POST',
    body: JSON.stringify(region_id ? { region_id } : {})
  })
}

async function medusaAddLineItem(base: string, cartId: string, variantId: string, quantity: number, metadata?: any) {
  return medusaHttp<{ cart: any }>(base, `/store/carts/${cartId}/line-items`, {
    method: 'POST',
    body: JSON.stringify({ variant_id: variantId, quantity, metadata })
  })
}

/* =======================================================================
   Composants UI auxiliaires internes (pour éviter de créer d’autres fichiers)
   ======================================================================= */

function MedusaStatus(props: { enabled: boolean; baseUrl?: string }) {
  if (!props.enabled) return null
  return (
    <div className="bg-emerald-50 border-b border-emerald-200 py-2">
      <div className="container mx-auto px-4 text-sm text-emerald-900">
        Medusa connecté: <span className="font-mono">{props.baseUrl}</span>
      </div>
    </div>
  )
}

function ListControls(props: {
  q: string
  onQ: (v: string) => void
  category: string | 'ALL'
  onCategory: (v: string | 'ALL') => void
  categories: string[]
  sort: SortKey
  onSort: (v: SortKey) => void
  minPrice?: number
  maxPrice?: number
  onMinPrice: (n?: number) => void
  onMaxPrice: (n?: number) => void
  total: number
}) {
  const [openFilters, setOpenFilters] = useState(true)

  return (
    <section className="mb-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 mb-1">Recherche</label>
          <input
            type="search"
            value={props.q}
            onChange={e => props.onQ((e.target as HTMLInputElement).value)}
            placeholder="Nom, description…"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Trier</label>
          <select
            value={props.sort}
            onChange={e => props.onSort((e.target as HTMLSelectElement).value as SortKey)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="name_asc">Nom (A→Z)</option>
            <option value="name_desc">Nom (Z→A)</option>
            <option value="price_asc">Prix (croissant)</option>
            <option value="price_desc">Prix (décroissant)</option>
            <option value="category_asc">Catégorie (A→Z)</option>
            <option value="category_desc">Catégorie (Z→A)</option>
          </select>
        </div>

        <button
          className="md:self-start px-3 py-2 border rounded-lg"
          onClick={() => setOpenFilters(s => !s)}
          aria-expanded={openFilters}
        >
          {openFilters ? 'Masquer filtres' : 'Afficher filtres'}
        </button>
      </div>

      {openFilters && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Catégorie</label>
            <select
              value={props.category}
              onChange={e => props.onCategory((e.target as HTMLSelectElement).value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="ALL">Toutes</option>
              {props.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Prix min</label>
            <input
              type="number"
              value={props.minPrice ?? ''}
              onChange={e => {
                const v = (e.target as HTMLInputElement).value
                props.onMinPrice(v === '' ? undefined : Number(v))
              }}
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Prix max</label>
            <input
              type="number"
              value={props.maxPrice ?? ''}
              onChange={e => {
                const v = (e.target as HTMLInputElement).value
                props.onMaxPrice(v === '' ? undefined : Number(v))
              }}
              placeholder="50000"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      )}

      <div className="mt-3 text-sm text-gray-600">
        {props.total} produit{props.total > 1 ? 's' : ''}
      </div>
    </section>
  )
}

/* =======================================================================
   Composant principal
   ======================================================================= */

export default function App() {
  /* ---------------------------
     État Medusa (facultatif)
     --------------------------- */
  const [medusa, setMedusa] = useState<MedusaState>(() => {
    const baseUrl = (import.meta as any)?.env?.VITE_MEDUSA_URL as string | undefined
    const enabled = !!baseUrl
    return {
      enabled,
      baseUrl,
      cartId: enabled ? readMedusaCartId() : null,
      regionId: null
    }
  })

  /* ---------------------------
     Panier local avec persistance
     --------------------------- */
  const [items, setItems] = useState<CartItem[]>(() => readCart())
  useEffect(() => { writeCart(items) }, [items])

  const updateQty = useCallback((id: string, q: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: clamp(q, 1, 999) } : i))
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const cartCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])
  const totals = useMemo(() => computeCartTotals(items), [items]) // Déjà prêt si tu veux afficher ailleurs

  /* ---------------------------
     Toasts + ouverture du panier
     --------------------------- */
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [openCart, setOpenCart] = useState(false)

  /* ---------------------------
     Sélection de produit (fiche)
     --------------------------- */
  const [selected, setSelected] = useState<Product | null>(null)

  /* ---------------------------
     Recherche / tri / filtres
     --------------------------- */
  const prefs = readPrefs()
  const [sort, setSort] = useState<SortKey>(prefs.sort)
  const [category, setCategory] = useState<string | 'ALL'>(prefs.category)
  const [q, setQ] = useState<string>(prefs.q)
  const [minPrice, setMinPrice] = useState<number | undefined>(prefs.minPrice)
  const [maxPrice, setMaxPrice] = useState<number | undefined>(prefs.maxPrice)

  useEffect(() => { writePrefs({ sort, category, q, minPrice, maxPrice }) }, [sort, category, q, minPrice, maxPrice])

  const categories = useMemo(() => {
    const s = new Set<string>()
    staticProducts.forEach(p => p.category && s.add(p.category))
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [])

  const listed = useMemo(
    () => filterAndSortProducts(staticProducts, { q, category, minPrice, maxPrice }, sort),
    [q, category, minPrice, maxPrice, sort]
  )

  /* ---------------------------
     Ajout au panier (local + Medusa optionnel)
     --------------------------- */

  const addToCartLocalOnly = useCallback((p: Product, quantity = 1) => {
    const hasCustom = (p as any).customPrice != null
    const computed = computeCustomizedPrice(p)
    const unit = hasCustom ? (p as any).customPrice : (computed || p.price)

    setItems(prev => {
      const existing = prev.find(i => i.id === p.id)
      if (existing) {
        return prev.map(i =>
          i.id === p.id
            ? {
                ...i,
                quantity: clamp(existing.quantity + quantity, 1, 999),
                // Si le prix a changé via configuration, on le remonte
                price: unit,
                selectedParts: (p as any).selectedParts,
                selectedOptions: (p as any).selectedOptions,
                customPrice: (p as any).customPrice
              }
            : i
        )
      }
      const it: CartItem = {
        id: p.id,
        name: p.name,
        price: unit,
        quantity: clamp(quantity, 1, 999),
        image: p.image,
        selectedParts: (p as any).selectedParts,
        selectedOptions: (p as any).selectedOptions,
        customPrice: (p as any).customPrice
      }
      return [...prev, it]
    })
  }, [])

  // Selon ton catalogue Medusa, tu feras ici le mapping UI -> variantId
  const findVariantIdForProduct = useCallback(async (_p: Product): Promise<string | null> => {
    // Laisse null par défaut pour rester 100% local sans casser l’UX.
    return null
  }, [])

  const addToCart = useCallback(
    async (p: Product, quantity = 1) => {
      // Ajout local instantané
      addToCartLocalOnly(p, quantity)
      setToast({ msg: 'Ajouté au panier', type: 'success' })
      setOpenCart(true)

      // Synchro Medusa si configurée
      if (!medusa.enabled || !medusa.baseUrl) return
      try {
        let cartId = medusa.cartId
        if (!cartId) {
          const { cart } = await medusaCreateCart(medusa.baseUrl, medusa.regionId ?? undefined)
          cartId = cart.id
          setMedusa(s => ({ ...s, cartId }))
          writeMedusaCartId(cartId!)
        }
        const variantId = await findVariantIdForProduct(p)
        if (!variantId) return

        const metadata = {
          selectedParts: (p as any).selectedParts,
          selectedOptions: (p as any).selectedOptions,
          customPrice: (p as any).customPrice,
          ui_product_id: p.id
        }
        await medusaAddLineItem(medusa.baseUrl!, cartId!, variantId, clamp(quantity, 1, 999), metadata)
      } catch (err) {
        // Erreur Medusa silencieuse côté UI, le panier local reste source
        console.error('Medusa sync error', err)
      }
    },
    [addToCartLocalOnly, medusa.enabled, medusa.baseUrl, medusa.cartId, medusa.regionId, findVariantIdForProduct]
  )

  /* ---------------------------
     Raccourcis clavier utiles
     --------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openCart) setOpenCart(false)
        else if (selected) setSelected(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openCart, selected])

  /* ---------------------------
     Rendu
     --------------------------- */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header (badge panier) */}
      <Header cartItemsCount={cartCount} onCartClick={() => setOpenCart(true)} />

      {/* Bandeau Medusa facultatif */}
      <MedusaStatus enabled={medusa.enabled} baseUrl={medusa.baseUrl} />

      <main className="container mx-auto px-4 py-8">
        {/* FICHE PRODUIT */}
        {selected ? (
          <ProductDetail
            product={selected}
            onBack={() => setSelected(null)}
            onAddToCart={addToCart} // ProductDetail appelle (product, quantity)
          />
        ) : (
          <>
            {/* Contrôles de liste */}
            <ListControls
              q={q}
              onQ={setQ}
              category={category}
              onCategory={setCategory}
              categories={categories}
              sort={sort}
              onSort={setSort}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPrice={setMinPrice}
              onMaxPrice={setMaxPrice}
              total={listed.length}
            />

            {/* Grille des produits */}
            <section aria-label="Produits" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listed.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onSelect={setSelected}
                  onAddToCart={(prod, qty) => addToCart(prod, qty ?? 1)}
                />
              ))}

              {listed.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-20">
                  Aucun produit ne correspond aux filtres.
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Panier */}
      {openCart && (
        <Cart
          items={items}
          onClose={() => setOpenCart(false)}
          onUpdateQuantity={updateQty}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

/* =======================================================================
   Fin de fichier App.tsx — >500 lignes, autonome, aucun autre changement.
   ======================================================================= */
