import { request } from './api.js'
const endpoint = (resource, id) => '/admin/resources/' + encodeURIComponent(resource) + (id ? '/' + encodeURIComponent(id) : '')
export const listRecords = resource => request(endpoint(resource))
export const saveRecord = (resource, record, id) => request(endpoint(resource, id), { method: id ? 'PATCH' : 'POST', data: record })
export const deleteRecord = (resource, id) => request(endpoint(resource, id), { method: 'DELETE' })
export const automationStatus = () => request('/admin/automations')
export const retryAutomations = () => request('/admin/automations/retry', { method: 'POST', data: {} })
