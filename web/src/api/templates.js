import request from '@/utils/request'

const BASE_URL = '/api/templates'

export function getTemplates() {
  return request({
    url: BASE_URL,
    method: 'get',
  })
}

export function getTemplate(id) {
  return request({
    url: `${BASE_URL}/${id}`,
    method: 'get',
  })
}

export function createTemplate(data) {
  return request({
    url: BASE_URL,
    method: 'post',
    data,
  })
}

export function updateTemplate(id, data) {
  return request({
    url: `${BASE_URL}/${id}`,
    method: 'put',
    data,
  })
}

export function deleteTemplate(id) {
  return request({
    url: `${BASE_URL}/${id}`,
    method: 'delete',
  })
}
