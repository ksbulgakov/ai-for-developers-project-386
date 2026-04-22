import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

export const apiClient = createClient<paths>({ baseUrl: '' })

export type EventType = components['schemas']['EventType']
export type EventTypeCreate = components['schemas']['EventTypeCreate']
export type Slot = components['schemas']['Slot']
export type BookingCreate = components['schemas']['BookingCreate']
export type Booking = components['schemas']['Booking']
export type Problem = components['schemas']['Problem']
