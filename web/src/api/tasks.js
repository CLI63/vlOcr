import request from '@/utils/request'

const BASE_URL = '/api/tasks'

export function createTask(data) {
  return request({
    url: BASE_URL,
    method: 'post',
    data,
  })
}

export function getTasks(params) {
  return request({
    url: BASE_URL,
    method: 'get',
    params,
  })
}

export function getTaskDetail(id) {
  return request({
    url: `${BASE_URL}/${id}`,
    method: 'get',
  })
}

export function retryTask(id) {
  return request({
    url: `${BASE_URL}/${id}/retry`,
    method: 'post',
  })
}

export function cancelTask(id) {
  return request({
    url: `${BASE_URL}/${id}/cancel`,
    method: 'post',
  })
}
