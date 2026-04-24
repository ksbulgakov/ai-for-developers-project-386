import { randomUUID } from 'node:crypto'
import { test as base, type APIRequestContext } from '@playwright/test'
import { API_BASE, E2E_PREFIX } from './constants'

export { API_BASE, E2E_PREFIX }

export function uniqueName(label: string): string {
  return `${E2E_PREFIX}${label}-${randomUUID().slice(0, 8)}`
}

export type EventTypePayload = {
  name: string
  durationMinutes: number
  description?: string
}

export type EventType = EventTypePayload & { id: string }

export type BookingPayload = {
  eventTypeId: string
  start: string
  guestName: string
  guestEmail: string
  notes?: string
}

export type Booking = BookingPayload & {
  id: string
  end: string
  createdAt: string
  eventTypeName: string
}

export type Slot = { start: string; end: string }

export type E2EApi = {
  createEventType: (payload: EventTypePayload) => Promise<EventType>
  createBooking: (payload: BookingPayload) => Promise<Booking>
  fetchSlots: (
    eventTypeId: string,
    from: string,
    to: string,
  ) => Promise<Slot[]>
}

export function nextWorkdayStartUTC(now: Date = new Date()): Date {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 9),
  )
  if (d.getTime() <= now.getTime()) {
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return d
}

export function endOfWorkdayUTC(dayStart: Date): Date {
  const d = new Date(dayStart)
  d.setUTCHours(18, 0, 0, 0)
  return d
}

export function formatYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function createEventTypeRaw(
  request: APIRequestContext,
  payload: EventTypePayload,
): Promise<EventType> {
  const response = await request.post(
    `${API_BASE}/api/v1/admin/event-types`,
    { data: payload },
  )
  if (!response.ok()) {
    throw new Error(
      `createEventType failed: ${response.status()} ${await response.text()}`,
    )
  }
  return (await response.json()) as EventType
}

async function createBookingRaw(
  request: APIRequestContext,
  payload: BookingPayload,
): Promise<Booking> {
  const response = await request.post(`${API_BASE}/api/v1/bookings`, {
    data: payload,
  })
  if (!response.ok()) {
    throw new Error(
      `createBooking failed: ${response.status()} ${await response.text()}`,
    )
  }
  return (await response.json()) as Booking
}

async function fetchSlotsRaw(
  request: APIRequestContext,
  eventTypeId: string,
  from: string,
  to: string,
): Promise<Slot[]> {
  const url = new URL(
    `${API_BASE}/api/v1/event-types/${eventTypeId}/slots`,
  )
  url.searchParams.set('from', from)
  url.searchParams.set('to', to)
  const response = await request.get(url.toString())
  if (!response.ok()) {
    throw new Error(
      `fetchSlots failed: ${response.status()} ${await response.text()}`,
    )
  }
  return (await response.json()) as Slot[]
}

async function cleanupLeftoverE2E(request: APIRequestContext): Promise<void> {
  const bookingsResp = await request.get(`${API_BASE}/api/v1/admin/bookings`)
  if (bookingsResp.ok()) {
    const bookings = (await bookingsResp.json()) as Array<{
      id: string
      eventTypeName: string
    }>
    await Promise.all(
      bookings
        .filter((b) => b.eventTypeName.startsWith(E2E_PREFIX))
        .map((b) =>
          request.delete(`${API_BASE}/api/v1/admin/bookings/${b.id}`),
        ),
    )
  }
  const typesResp = await request.get(`${API_BASE}/api/v1/admin/event-types`)
  if (typesResp.ok()) {
    const items = (await typesResp.json()) as Array<{
      id: string
      name: string
    }>
    await Promise.all(
      items
        .filter((item) => item.name.startsWith(E2E_PREFIX))
        .map((item) =>
          request.delete(`${API_BASE}/api/v1/admin/event-types/${item.id}`),
        ),
    )
  }
}

export const test = base.extend<{ api: E2EApi; safetyNet: void }>({
  api: async ({ request }, use) => {
    const eventTypeIds: string[] = []
    const bookingIds: string[] = []

    const api: E2EApi = {
      async createEventType(payload) {
        const et = await createEventTypeRaw(request, payload)
        eventTypeIds.push(et.id)
        return et
      },
      async createBooking(payload) {
        const b = await createBookingRaw(request, payload)
        bookingIds.push(b.id)
        return b
      },
      fetchSlots: (eventTypeId, from, to) =>
        fetchSlotsRaw(request, eventTypeId, from, to),
    }

    await use(api)

    for (const id of bookingIds) {
      await request.delete(`${API_BASE}/api/v1/admin/bookings/${id}`)
    }
    for (const id of eventTypeIds) {
      await request.delete(`${API_BASE}/api/v1/admin/event-types/${id}`)
    }
  },
  safetyNet: [
    async ({ request }, use) => {
      await use()
      await cleanupLeftoverE2E(request)
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'
