import request from '@/utils/request'

const BASE_URL = '/api/corrections'

export function getCorrectionByHistoryId(historyId) {
  return request({
    url: `${BASE_URL}/history/${historyId}`,
    method: 'get',
  })
}

export function saveCorrection(historyId, data) {
  return request({
    url: `${BASE_URL}/history/${historyId}`,
    method: 'post',
    data,
  })
}

export function confirmCorrection(id) {
  return request({
    url: `${BASE_URL}/${id}/confirm`,
    method: 'post',
  })
}
