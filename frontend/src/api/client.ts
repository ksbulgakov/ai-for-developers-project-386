import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

export const apiClient = createClient<paths>({ baseUrl: '' })

export type EventType = components['schemas']['EventType']
export type EventTypeCreate = components['schemas']['EventTypeCreate']
