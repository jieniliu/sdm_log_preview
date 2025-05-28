import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'https://hs.sending.me',
  // baseURL: 'https://hs-alpha.sending.me',
  // baseURL: 'http://localhost:8300',
  headers: {
    'Content-Type': 'application/json'
  }
})

export default {
  getLogSummary(startAt, endAt, messageType, userId) {
    return apiClient.post('/_api/client/r0/log_center/summary_data_center', {
      start_at: startAt,
      end_at: endAt,
      message_type: messageType || undefined,
      user_id: userId || undefined
    })
  },
  searchUserLogs(params) {
    return apiClient.post('/_api/client/r0/log_center/search_user_log', params)
  }
}
