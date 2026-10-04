import { normalizeSite } from './media'
import type { BookingRequestPayload, PublicSite } from '../types/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const hasBody = options?.body !== undefined && options?.body !== null
  const headers = new Headers(options?.headers || {})
  // Do not attach application/json to GET/HEAD requests. That header turns a
  // simple cross-origin GET into a CORS preflight on Safari and some WebViews.
  if (hasBody && !(options?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: options?.cache ?? 'no-store',
    headers,
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const data = await response.json()
      message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    } catch {
      message = response.statusText
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return response.json()
}

export async function getPublicSite(): Promise<PublicSite> {
  const site = await request<PublicSite>(`/site?_=${Date.now()}`)
  return normalizeSite(site)
}

export async function createBookingRequest(payload: BookingRequestPayload) {
  return request('/booking-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function readTrackingParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    page_url: window.location.href,
    source: document.referrer || 'direct',
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
  }
}
