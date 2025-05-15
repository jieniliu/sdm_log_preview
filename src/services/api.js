import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'https://hs-alpha.sending.me',
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
  }
}
