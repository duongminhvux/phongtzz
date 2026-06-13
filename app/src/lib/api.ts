import { defaultLandingPage, fallbackRooms } from '../data/defaultLanding'
import type { BookingRequestPayload, LandingPage, Room } from '../types/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
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

export async function getLandingPage(): Promise<LandingPage> {
  try {
    const data = await request<{ value: LandingPage }>('/landing-page')
    return data.value || defaultLandingPage
  } catch {
    return defaultLandingPage
  }
}

export async function getRooms(): Promise<Room[]> {
  try {
    const rooms = await request<Room[]>('/rooms')
    return rooms.length ? rooms : fallbackRooms
  } catch {
    return fallbackRooms
  }
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
