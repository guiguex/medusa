import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CartItem, Product } from '../types'
import { createCart, addLineItem } from '../lib/medusa'

const LS_KEY = 'cart_items'
const LS_CART = 'medusa_cart_id'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [cartId, setCartId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      const parsed = raw ? JSON.parse(raw) as CartItem[] : []
      setItems(parsed)
      setCartId(localStorage.getItem(LS_CART))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items))
  }, [items])

  const add = useCallback(async (p: Product, quantity = 1) => {
    const unit = (p as any).customPrice ?? p.price
    setItems(prev => {
      const existing = prev.find(i => i.id === p.id)
      if (existing) {
        return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + quantity, price: unit } : i)
      }
      return [...prev, {
        id: p.id,
        name: p.name,
        price: unit,
        quantity,
        image: p.image,
        selectedParts: (p as any).selectedParts,
        selectedOptions: (p as any).selectedOptions,
        customPrice: (p as any).customPrice
      }]
    })

    if (import.meta.env.VITE_MEDUSA_URL) {
      let cid = cartId
      if (!cid) {
        try {
          const { cart } = await createCart()
          cid = cart.id
          setCartId(cid)
          localStorage.setItem(LS_CART, cid!)
        } catch {}
      }
      // À adapter: trouve ton variantId réel (via Medusa /store/products/{id})
      // Ici on pousse en metadata les sélections configurateur.
      // await addLineItem(cid!, variantId, quantity, { selectedParts, selectedOptions })
    }
  }, [cartId])

  const updateQty = useCallback((id: string, q: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: q } : i))
  }, [])

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])

  return { items, add, updateQty, remove, clear, count }
}
