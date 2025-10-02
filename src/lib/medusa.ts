const BASE = import.meta.env.VITE_MEDUSA_URL?.replace(/\/+$/, '') ?? ''

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) throw new Error('VITE_MEDUSA_URL non défini')
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export async function listProducts(params: { limit?: number; q?: string } = {}) {
  const query = new URLSearchParams()
  if (params.limit) query.set('limit', String(params.limit))
  if (params.q) query.set('q', params.q)
  // v1/v2 store endpoint compatible: /store/products
  return http<{ products: any[] }>(`/store/products?${query.toString()}`)
}

export async function retrieveProduct(idOrHandle: string) {
  // tente /store/products/{id}
  try {
    return await http<{ product: any }>(`/store/products/${idOrHandle}`)
  } catch {
    // fallback par handle ?handle=xxx
    return http<{ products: any[] }>(`/store/products?handle=${encodeURIComponent(idOrHandle)}`)
  }
}

export async function createCart(region_id?: string) {
  return http<{ cart: any }>(`/store/carts`, {
    method: 'POST',
    body: JSON.stringify(region_id ? { region_id } : {}),
  })
}

export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity: number,
  metadata?: Record<string, any>
) {
  return http<{ cart: any }>(`/store/carts/${cartId}/line-items`, {
    method: 'POST',
    body: JSON.stringify({ variant_id: variantId, quantity, metadata }),
  })
}

export async function updateLineItem(cartId: string, lineId: string, quantity: number) {
  return http<{ cart: any }>(`/store/carts/${cartId}/line-items/${lineId}`, {
    method: 'POST',
    body: JSON.stringify({ quantity }),
  })
}
