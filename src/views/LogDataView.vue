<template>
  <div class="log-data-container">
    <h1 class="page-title">日志数据中心</h1>
    
    <el-card class="filter-card">
      <div class="filter-container">
        <div class="filter-group">
          <div class="filter-item">
            <span class="filter-label">开始时间：</span>
            <el-date-picker
              v-model="filters.startTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="x"
              size="small"
              class="custom-date-picker dark-date-input"
              :popper-class="'dark-date-picker'"
              :clearable="true"
              :clear-icon="'el-icon-circle-close'"
            />
          </div>
          
          <div class="filter-item">
            <span class="filter-label">结束时间：</span>
            <el-date-picker
              v-model="filters.endTime"
              type="datetime"
              placeholder="选择结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="x"
              size="small"
              class="custom-date-picker dark-date-input"
              :popper-class="'dark-date-picker'"
              :clearable="true"
              :clear-icon="'el-icon-circle-close'"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <div class="filter-item">
            <span class="filter-label">消息类型：</span>
            <el-select
              v-model="filters.messageType"
              placeholder="请选择消息类型"
              clearable
              size="small"
              popper-class="dark-select-dropdown"
              class="dark-select"
              @change="onMessageTypeChange"
            >
              <el-option label="文本消息" value="m.text" />
              <el-option label="图片消息" value="m.image" />
              <el-option label="视频消息" value="m.video" />
              <el-option label="语音消息" value="m.audio" />
              <el-option label="图库消息" value="m.gallery" />
              <el-option label="文件消息" value="m.file" />
            </el-select>
          </div>
        </div>

        <div class="filter-group filter-button-group">
          <el-button type="primary" @click="fetchData" size="small" class="query-button">查询</el-button>
        </div>
      </div>
    </el-card>
    
    <div class="data-display-section">
      <!-- 核心指标卡片 -->
      <el-row :gutter="20">
        <el-col :xs="24" :sm="6" :md="6" :lg="6" :xl="6">
          <div class="custom-metric-card">
            <div class="metric-value">{{ logData.user_count || 0 }}</div>
            <div class="metric-title">用户数量</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6" :md="6" :lg="6" :xl="6">
          <div class="custom-metric-card">
            <div class="metric-value">{{ formatNumber(logData.avg_socket_time?.average_response_time || 0) }}</div>
            <div class="metric-title">Socket响应时间 (ms)</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6" :md="6" :lg="6" :xl="6">
          <div class="custom-metric-card">
            <div class="metric-value">{{ formatNumber(logData.roaming_message_avg_time || 0) }}</div>
            <div class="metric-title">漫游消息接收时间 (ms)</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6" :md="6" :lg="6" :xl="6">
          <div class="custom-metric-card">
            <div class="metric-value">{{ formatNumber(logData.delay_message_avg_time || 0) }}</div>
            <div class="metric-title">在线状态接收消息耗时 (ms)</div>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-bottom: 24px;">
        <el-col v-if="filters.messageType === 'm.text' || !filters.messageType" :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
          <el-card class="table-card custom-table-card" style="height: 100%;">
            <template #header>
              <div class="card-header"><h3>文本消息耗时分布</h3></div>
            </template>
            <div class="metric-card-inner">
              <div v-for="(v, k) in textMessageAvgList" :key="k" style="margin-bottom: 10px; display: flex; align-items: center;">
                <span class="metric-card-label" style="width: 100px;">{{ v.label }}</span>
                <span class="metric-card-value" style="margin-left: 10px; min-width: 100px;">{{ v.value }} ms</span>
                <span class="metric-card-percent" style="margin-left: 10px; min-width: 40px; color: var(--text-secondary);">{{ v.percent }}%</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col v-else :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
          <el-card class="table-card custom-table-card" style="height: 100%;">
            <template #header>
              <div class="card-header"><h3>附件消息耗时分布</h3></div>
            </template>
            <div class="metric-card-inner">
              <div v-for="(v, k) in attachmentMessageAvgList" :key="k" style="margin-bottom: 10px; display: flex; align-items: center;">
                <span class="metric-card-label" style="width: 100px;">{{ v.label }}</span>
                <span class="metric-card-value" style="margin-left: 10px; min-width: 100px;">{{ v.value }} ms</span>
                <span class="metric-card-percent" style="margin-left: 10px; min-width: 40px; color: var(--text-secondary);">{{ v.percent }}%</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <!-- 分组表格区域 -->
      <el-row :gutter="20">
        <!-- 左侧：消息、加解密、房间/Socket -->
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
          <el-card class="table-card custom-table-card" style="margin-bottom: 20px;">
            <template #header>
              <div class="card-header"><h3>消息相关</h3></div>
            </template>
            <div class="table-wrapper">
              <el-table :data="actionGroup.message" size="small" stripe style="width: 100%" class="dark-table custom-border-table no-header-line">
                <el-table-column prop="name" label="事件" min-width="120" />
                <el-table-column prop="value" label="数值" width="100" align="right" />
                <el-table-column prop="key" label="字段" min-width="140" class-name="field-column" />
              </el-table>
            </div>
          </el-card>
          <el-card class="table-card custom-table-card" style="margin-bottom: 20px;">
            <template #header>
              <div class="card-header"><h3>加解密相关</h3></div>
            </template>
            <div class="table-wrapper">
              <el-table :data="actionGroup.crypto" size="small" stripe style="width: 100%" class="dark-table custom-border-table no-header-line">
                <el-table-column prop="name" label="事件" min-width="120" />
                <el-table-column prop="value" label="数值" width="100" align="right" />
                <el-table-column prop="key" label="字段" min-width="140" class-name="field-column" />
              </el-table>
            </div>
          </el-card>
          <el-card class="table-card custom-table-card">
            <template #header>
              <div class="card-header"><h3>房间/Socket相关</h3></div>
            </template>
            <div class="table-wrapper">
              <el-table :data="actionGroup.roomSocket" size="small" stripe style="width: 100%" class="dark-table custom-border-table no-header-line">
                <el-table-column prop="name" label="事件" min-width="120" />
                <el-table-column prop="value" label="数值" width="100" align="right" />
                <el-table-column prop="key" label="字段" min-width="140" class-name="field-column" />
              </el-table>
            </div>
          </el-card>
        </el-col>
        <!-- 右侧：上传相关 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <el-card class="table-card custom-table-card">
            <template #header>
              <div class="card-header"><h3>上传相关</h3></div>
            </template>
            <div class="table-wrapper">
              <el-table :data="actionGroup.upload" size="small" stripe style="width: 100%" class="dark-table custom-border-table no-header-line">
                <el-table-column prop="name" label="事件" min-width="120" />
                <el-table-column prop="value" label="数值" width="100" align="right" />
                <el-table-column prop="key" label="字段" min-width="140" class-name="field-column" />
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row v-if="actionGroup.other.length">
        <el-col :span="24">
          <el-card class="table-card custom-table-card">
            <template #header>
              <div class="card-header"><h3>其它操作</h3></div>
            </template>
            <div class="table-wrapper">
              <el-table :data="actionGroup.other" size="small" stripe style="width: 100%" class="dark-table custom-border-table no-header-line">
                <el-table-column prop="name" label="事件" min-width="120" />
                <el-table-column prop="value" label="数值" width="100" align="right" />
                <el-table-column prop="key" label="字段" min-width="140" class-name="field-column" />
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <!-- user_logs 表格及筛选 -->
      <el-card v-if="logData.user_logs && logData.user_logs.length" class="table-card custom-table-card" style="margin-top: 32px;">
        <template #header>
          <div class="card-header">
            <h3>用户日志明细</h3>
          </div>
        </template>
        <div class="user-logs-filter-bar" style="margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
          <el-input v-model="userLogsFilter.device_id" placeholder="筛选 device_id" size="small" class="dark-input" clearable style="width: 180px;" />
          <el-input v-model="userLogsFilter.launch_id" placeholder="筛选 launch_id" size="small" class="dark-input" clearable style="width: 180px;" />
          <el-input v-model="userLogsFilter.event_type" placeholder="筛选 event_type" size="small" class="dark-input" clearable style="width: 180px;" />
          <el-input v-model="userLogsFilter.event_id" placeholder="筛选 event_id" size="small" class="dark-input" clearable style="width: 180px;" />
          <el-input v-model="userLogsFilter.local_event_id" placeholder="筛选 local_event_id" size="small" class="dark-input" clearable style="width: 180px;" />
          <el-button size="small" @click="clearUserLogsFilter" type="info">重置</el-button>
        </div>
        <div class="table-wrapper">
          <el-table :data="filteredUserLogs" size="small" stripe style="width: 100%" class="dark-table custom-border-table no-header-line">
            <el-table-column prop="sdn_url" label="sdn_url" min-width="160" />
            <el-table-column prop="trace_id" label="trace_id" min-width="180" />
            <el-table-column prop="user_id" label="user_id" min-width="220" />
            <el-table-column prop="platform" label="platform" min-width="100" />
            <el-table-column prop="device_id" label="device_id" min-width="180" />
            <el-table-column prop="launch_id" label="launch_id" min-width="180" />
            <el-table-column prop="action_type" label="action_type" min-width="160" />
            <el-table-column prop="room_id" label="room_id" min-width="160" />
            <el-table-column prop="event_type" label="event_type" min-width="160" />
            <el-table-column prop="message_type" label="message_type" min-width="160" />
            <el-table-column prop="local_event_id" label="local_event_id" min-width="180" />
            <el-table-column prop="event_id" label="event_id" min-width="180" />
            <el-table-column prop="other" label="other" min-width="120" />
            <el-table-column prop="timestamp" label="timestamp" min-width="180" />
          </el-table>
        </div>
      </el-card>
      <!-- userLogs 独立搜索区和表格 -->
      <el-card class="table-card custom-table-card" style="margin-top: 32px;">
        <template #header>
          <div class="card-header">
            <h3>用户日志搜索</h3>
          </div>
        </template>
        <div class="user-logs-filter-bar" style="margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
          <el-date-picker v-model="userLogsSearch.start_at" type="datetime" placeholder="开始时间" format="YYYY-MM-DD HH:mm:ss" value-format="x" size="small" class="dark-date-input" style="width: 180px;" />
          <el-date-picker v-model="userLogsSearch.end_at" type="datetime" placeholder="结束时间" format="YYYY-MM-DD HH:mm:ss" value-format="x" size="small" class="dark-date-input" style="width: 180px;" />
          <el-input v-model="userLogsSearch.user_id" placeholder="user_id" size="small" class="dark-input" clearable style="width: 160px;" />
          <el-input v-model="userLogsSearch.device_id" placeholder="device_id" size="small" class="dark-input" clearable style="width: 140px;" />
          <el-input v-model="userLogsSearch.launch_id" placeholder="launch_id" size="small" class="dark-input" clearable style="width: 140px;" />
          <el-input v-model="userLogsSearch.action_type" placeholder="action_type" size="small" class="dark-input" clearable style="width: 140px;" />
          <el-input v-model="userLogsSearch.room_id" placeholder="room_id" size="small" class="dark-input" clearable style="width: 140px;" />
          <el-input v-model="userLogsSearch.message_type" placeholder="message_type" size="small" class="dark-input" clearable style="width: 140px;" />
          <el-input v-model="userLogsSearch.event_id" placeholder="event_id" size="small" class="dark-input" clearable style="width: 140px;" />
          <el-input v-model="userLogsSearch.local_event_id" placeholder="local_event_id" size="small" class="dark-input" clearable style="width: 140px;" />
          <el-button size="small" type="primary" @click="searchUserLogs">搜索</el-button>
          <el-button size="small" @click="clearUserLogsSearch" type="info">重置</el-button>
        </div>
        <div class="table-wrapper">
          <el-table :data="userLogsSearchResult" size="small" stripe style="width: 100%" class="dark-table custom-border-table no-header-line">
            <el-table-column prop="sdn_url" label="sdn_url" min-width="160" />
            <el-table-column prop="trace_id" label="trace_id" min-width="180" />
            <el-table-column prop="user_id" label="user_id" min-width="220" />
            <el-table-column prop="platform" label="platform" min-width="100" />
            <el-table-column prop="device_id" label="device_id" min-width="180" />
            <el-table-column prop="launch_id" label="launch_id" min-width="180" />
            <el-table-column prop="action_type" label="action_type" min-width="160" />
            <el-table-column prop="room_id" label="room_id" min-width="160" />
            <el-table-column prop="event_type" label="event_type" min-width="160" />
            <el-table-column prop="message_type" label="message_type" min-width="160" />
            <el-table-column prop="local_event_id" label="local_event_id" min-width="180" />
            <el-table-column prop="event_id" label="event_id" min-width="180" />
            <el-table-column prop="other" label="other" min-width="120" />
            <el-table-column prop="timestamp" label="timestamp" min-width="180" />
          </el-table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
import { ElLoading } from 'element-plus'

// 只处理新结构
function adaptLogData(raw) {
  return {
    action_type_count: raw.action_type_count || {},
    avg_socket_time: raw.avg_socket_time || {},
    user_count: raw.user_count || 0,
    roaming_message_avg_time: raw.roaming_message_avg_time || 0,
    delay_message_avg_time: raw.delay_message_avg_time || 0,
    attachment_message_avg_time: raw.attachment_message_avg_time || {},
    text_message_avg_time: raw.text_message_avg_time || {},
    ...raw
  }
}

export default {
  name: 'LogDataView',
  data() {
    return {
      filters: {
        startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 默认7天前
        endTime: Date.now(),
        messageType: 'm.text'
      },
      logData: {
        action_type_count: {},
        avg_socket_time: {},
        user_count: 0,
        roaming_message_avg_time: 0,
        delay_message_avg_time: 0,
        attachment_message_avg_time: {},
        text_message_avg_time: {}
      },
      userLogsFilter: {
        device_id: '',
        launch_id: '',
        event_type: '',
        event_id: '',
        local_event_id: ''
      },
      userLogsSearch: {
        start_at: 0,
        end_at: Date.now(),
        user_id: '',
        device_id: '',
        launch_id: '',
        action_type: '',
        room_id: '',
        message_type: '',
        event_id: '',
        local_event_id: ''
      },
      userLogsSearchResult: [],
    }
  },
  computed: {
    actionGroup() {
      // 分组规则
      const nameMap = {
        socket_disconnected_count: 'socket断开次数',
        launch_count: '启动次数',
        enter_room_count: '进入房间次数',
        send_message_count: '发消息次数',
        send_success_count: '消息发送成功次数',
        send_fail_count: '消息发送失败次数',
        encrypt_event: '加密事件',
        encrypt_event_success: '加密成功',
        encrypt_event_failed: '加密失败',
        decrypt_event_failed: '解密失败',
        decrypt_event_success: '解密成功',
        upload_image: '上传图片',
        upload_image_success: '上传图片成功',
        upload_image_failed: '上传图片失败',
        upload_image_cancelled: '取消上传图片',
        upload_video: '上传视频',
        upload_video_success: '上传视频成功',
        upload_video_failed: '上传视频失败',
        upload_gallery_list: '上传图库',
        upload_gallery_list_success: '上传图库成功',
        upload_gallery_list_failed: '上传图库失败',
        upload_gallery_list_cancelled: '取消上传图库',
        upload_file: '上传文件',
        upload_file_success: '上传文件成功',
        upload_file_failed: '上传文件失败',
        upload_file_cancelled: '取消上传文件',
      }
      // 动态分组
      const all = Object.entries(this.logData.action_type_count || {}).map(([key, value]) => ({
        name: nameMap[key] || key,
        value,
        key
      }))
      // 上传相关：所有以 upload_ 开头的
      const upload = all.filter(i => i.key.startsWith('upload_'))
      // 加解密相关：encrypt_*, decrypt_*
      const crypto = all.filter(i => i.key.startsWith('encrypt_') || i.key.startsWith('decrypt_'))
      // 消息相关：send_*
      const message = all.filter(i => i.key.startsWith('send_'))
      // 房间/Socket相关
      const roomSocket = all.filter(i => ['launch_count', 'enter_room_count', 'socket_disconnected_count'].includes(i.key))
      // 其它
      const groupedKeys = new Set([...upload, ...crypto, ...message, ...roomSocket].map(i => i.key))
      const other = all.filter(i => !groupedKeys.has(i.key))
      // 分组内排序
      const sortByKey = arr => arr.slice().sort((a, b) => a.key.localeCompare(b.key))
      return {
        message: sortByKey(message),
        upload: sortByKey(upload),
        crypto: sortByKey(crypto),
        roomSocket: sortByKey(roomSocket),
        other: sortByKey(other)
      }
    },
    timeData() {
      const timeFields = [
        { key: 'avg_socket_time', name: 'socket链接时长', value: this.formatNumber(this.logData.avg_socket_time?.average_response_time || 0) },
        { key: 'roaming_message_avg_time', name: '漫游消息接收时间', value: this.formatNumber(this.logData.roaming_message_avg_time || 0) },
        { key: 'delay_message_avg_time', name: '在线状态接收消息耗时', value: this.formatNumber(this.logData.delay_message_avg_time || 0) }
      ]
      return timeFields.filter(item => Number(item.value) > 0)
    },
    userLogsColumns() {
      // 动态生成 user_logs 的所有字段列
      const logs = this.logData.user_logs || []
      if (!logs.length) return []
      return Object.keys(logs[0]).map(key => ({
        prop: key,
        label: key,
        minWidth: 120
      }))
    },
    filteredUserLogs() {
      // 多条件模糊筛选
      const { device_id, launch_id, event_type, event_id, local_event_id } = this.userLogsFilter
      return (this.logData.user_logs || []).filter(item => {
        if (device_id && !(item.device_id || '').includes(device_id)) return false
        if (launch_id && !(item.launch_id || '').includes(launch_id)) return false
        if (event_type && !(item.event_type || '').includes(event_type)) return false
        if (event_id && !(item.event_id || '').includes(event_id)) return false
        if (local_event_id && !(item.local_event_id || '').includes(local_event_id)) return false
        return true
      })
    },
    textMessageAvgList() {
      const t = this.logData.text_message_avg_time || {}
      const total = t.send_text_message_avg_time || 1
      return [
        { label: '加密耗时', value: this.formatNumber(t.encrypt_avg_time || 0), percent: 0 },
        { label: 'API耗时', value: this.formatNumber(t.send_text_message_avg_time || 0), percent: 0 }
      ]
    },
    attachmentMessageAvgList() {
      const t = this.logData.attachment_message_avg_time || {}
      const total = t.send_message_total_avg_time || 1
      return [
        { label: '上传耗时', value: this.formatNumber(t.upload_avg_time || 0), percent: t.upload_avg_time && total ? Math.round(100 * t.upload_avg_time / total) : 0 },
        { label: '发送API耗时', value: this.formatNumber(t.send_message_api_avg_time || 0), percent: t.send_message_api_avg_time && total ? Math.round(100 * t.send_message_api_avg_time / total) : 0 },
        { label: '总耗时', value: this.formatNumber(t.send_message_total_avg_time || 0), percent: 100 }
      ]
    },
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      let loadingInstance = null
      try {
        loadingInstance = ElLoading.service({
          lock: true,
          text: '加载中...',
          background: 'rgba(0,0,0,0.3)'
        })
        const response = await api.getLogSummary(
          this.filters.startTime,
          this.filters.endTime,
          this.filters.messageType
        )
        this.logData = adaptLogData(response.data)
      } catch (error) {
        console.error('获取日志数据失败:', error)
        this.$message.error('获取数据失败，请稍后重试')
      } finally {
        if (loadingInstance) loadingInstance.close()
      }
    },
    formatNumber(value) {
      return Number(value).toFixed(1)
    },
    clearUserLogsFilter() {
      this.userLogsFilter = {
        device_id: '',
        launch_id: '',
        event_type: '',
        event_id: '',
        local_event_id: ''
      }
    },
    async searchUserLogs() {
      try {
        const params = { ...this.userLogsSearch }
        // 时间戳转数字
        params.start_at = Number(params.start_at) || 0
        params.end_at = Number(params.end_at) || Date.now()
        const { data } = await api.searchUserLogs(params)
        this.userLogsSearchResult = Array.isArray(data) ? data : []
      } catch (e) {
        this.userLogsSearchResult = []
        this.$message.error('用户日志搜索失败')
      }
    },
    clearUserLogsSearch() {
      this.userLogsSearch = {
        start_at: 0,
        end_at: Date.now(),
        user_id: '',
        device_id: '',
        launch_id: '',
        action_type: '',
        room_id: '',
        message_type: '',
        event_id: '',
        local_event_id: ''
      }
      this.userLogsSearchResult = []
    },
    onMessageTypeChange() {
      this.fetchData()
    },
  }
}
</script>

<style lang="scss" scoped>
.log-data-container {
  padding: 20px;
  min-height: 100vh;
}

.page-title {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text-color);
  font-weight: 500;
  text-align: center;
}

.filter-card {
  margin-bottom: 20px;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
}

.filter-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  margin-bottom: 5px;
  width: 100%;
  justify-content: center;
}

.filter-button-group {
  margin-top: 5px;
}

.query-button {
  min-width: 100px;
  font-size: 0.95rem;
  padding: 8px 20px;
}

.filter-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
  flex: 0 0 auto;
}

.filter-label {
  color: var(--text-color);
  margin-right: 10px;
  min-width: 70px;
  white-space: nowrap;
}

.data-display-section {
  margin-top: 20px;
}

.custom-metric-card {
  padding: 15px;
  text-align: center;
  margin-bottom: 20px;
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--border-color) !important;
  position: relative;
  overflow: hidden;
  background-color: transparent;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--highlight-color) !important;
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
  }
}

.metric-value {
  font-size: 2.2rem;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 10px;
  text-shadow: 0 0 10px rgba(64, 158, 255, 0.15);
}

.metric-title {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 400;
}

.table-card {
  margin-bottom: 20px;
  border: 1px solid var(--border-color) !important;
  position: relative;
  overflow: hidden;
  background-color: transparent;
  
  &::after, &::before {
    display: none !important;
  }
}

.field-column {
  color: var(--text-secondary);
  font-size: 0.9em;
}

.metric-card-inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.metric-card-label {
  font-size: 1rem;
  color: var(--text-secondary);
  min-width: 80px;
  display: inline-block;
}

.metric-card-value {
  font-size: 1rem;
  color: var(--text-color);
  font-weight: 500;
  margin-left: 10px;
}

.metric-secondary {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 5px;
  text-align: right;
}

// 深色日期选择器样式
:deep(.dark-date-input) {
  .el-input__inner {
    background-color: #232323 !important;
    color: var(--text-color) !important;
    border-color: #444 !important;
  }
  input {
    background-color: #232323 !important;
    color: var(--text-color) !important;
  }
  .el-input__prefix, .el-input__suffix {
    background-color: transparent !important;
  }
  .el-input__clear {
    background-color: transparent !important;
    color: var(--text-secondary) !important;
  }
  .el-input__icon {
    background-color: transparent !important;
  }
}

:deep(.dark-date-picker) {
  background-color: #1e1e1e !important;
  border: 1px solid var(--border-color) !important;
  
  .el-date-table td {
    background-color: #1e1e1e !important;
  }
  
  .el-date-picker__header {
    background-color: #1e1e1e !important;
  }
  
  .el-picker-panel__icon-btn {
    color: var(--text-secondary) !important;
  }
  
  .el-date-picker__header-label {
    color: var(--text-color) !important;
  }
  
  .el-picker-panel__content {
    background-color: #1e1e1e !important;
  }
  
  .el-date-table th, 
  .el-date-table td.next-month, 
  .el-date-table td.prev-month {
    color: var(--text-secondary) !important;
  }
  
  .el-date-table td.available:hover {
    color: var(--highlight-color) !important;
  }
  
  .el-picker-panel__footer {
    background-color: #1e1e1e !important;
    border-top: 1px solid var(--border-color) !important;
  }
  
  .el-button--text {
    color: var(--text-color) !important;
  }
  
  .el-button--default {
    background-color: #2a2a2a !important;
    border-color: var(--border-color) !important;
    color: var(--text-color) !important;
  }
  
  .el-input__icon,
  .el-input__prefix,
  .el-input__suffix {
    background-color: transparent !important;
  }
  
  .el-date-editor .el-range__close-icon {
    background-color: transparent !important;
    color: var(--text-secondary) !important;
  }
  
  .el-time-panel {
    background-color: #1e1e1e !important;
    border-color: var(--border-color) !important;
  }
  
  .el-time-panel__content,
  .el-time-spinner__wrapper,
  .el-time-spinner__item {
    background-color: #1e1e1e !important;
    color: var(--text-color) !important;
  }
  
  .el-date-editor--datetimerange,
  .el-range-editor--datetimerange {
    background-color: #2a2a2a !important;
  }
  
  .el-date-editor .el-range-input {
    background-color: #2a2a2a !important;
    color: var(--text-color) !important;
  }
  
  .el-date-editor .el-range-separator {
    color: var(--text-secondary) !important;
  }
  
  .popper__arrow {
    background-color: #1e1e1e !important;
    border-color: var(--border-color) !important;
  }
  
  .popper__arrow::after {
    border-color: #1e1e1e !important;
  }
  
  // 修复时间选择器的白色部分
  .el-time-panel__content::after,
  .el-time-panel__content::before {
    background-color: #333 !important;
  }
  
  .el-time-spinner__wrapper::after,
  .el-time-spinner__wrapper::before {
    background-color: #333 !important;
  }
  
  .el-time-panel__footer {
    background-color: #1e1e1e !important;
    border-top: 1px solid var(--border-color) !important;
  }
  
  .el-input__inner {
    background-color: #2a2a2a !important;
    border-color: var(--border-color) !important;
  }
  
  // 隐藏白色边线
  .el-date-picker__time-header {
    border-bottom: 1px solid var(--border-color) !important;
  }
}

:deep(.dark-select) {
  min-width: 160px;
  
  .el-input__inner {
    background-color: #232323 !important;
    color: var(--text-color) !important;
    border-color: #444 !important;
  }
  
  .el-select__tags {
    background-color: transparent !important;
    
    .el-tag {
      background-color: rgba(64, 158, 255, 0.15) !important;
      color: var(--text-color) !important;
      border-color: rgba(64, 158, 255, 0.3) !important;
      margin: 2px;
    }
  }
  
  .el-select-dropdown__item.selected {
    color: var(--highlight-color) !important;
    font-weight: bold;
    background-color: rgba(64, 158, 255, 0.1) !important;
  }
}

:deep(.dark-select-dropdown) {
  background-color: #1e1e1e !important;
  
  .el-select-dropdown__item {
    color: var(--text-color) !important;
  }
  
  .el-select-dropdown__item.hover {
    background-color: #333 !important;
  }
}

// 处理所有可能的白线
:deep(.el-card) {
  background-color: transparent !important;
  
  &::after, &::before {
    background-color: var(--border-color) !important;
    z-index: -1;
  }
  
  .el-card__header {
    border-bottom: 1px solid var(--divider-color) !important;
    background-color: transparent !important;
  }
  
  .el-card__body {
    background-color: transparent !important;
  }
}

:deep(.dark-table) {
  background-color: transparent !important;
  
  &::before {
    height: 0 !important;
    background-color: transparent !important;
  }
  
  &::after {
    background-color: var(--divider-color) !important;
  }
  
  th.el-table__cell {
    background-color: transparent !important;
    border-bottom: 1px solid var(--divider-color) !important;
  }
  
  tr.el-table__row td {
    background-color: transparent !important;
    border-bottom: 1px solid var(--light-border) !important;
  }
  
  tr.el-table__row:nth-child(even) td {
    background-color: rgba(36, 37, 42, 0.15) !important;
  }
  
  tr.highlighted-row td {
    background-color: rgba(64, 158, 255, 0.15) !important;
  }
  
  .el-table__header-wrapper {
    border-bottom: 1px solid var(--divider-color) !important;
  }

  // 修复表格内部可能的白色背景
  .el-table__body, 
  .el-table__footer,
  .el-table__header {
    background-color: transparent !important;
  }

  .el-table__empty-block {
    background-color: transparent !important;
  }

  .el-table__cell {
    background-color: transparent !important;
  }
}

// 增加全局表格样式覆盖
:deep(.el-table) {
  background-color: transparent !important;
  color: var(--text-color) !important;
  
  tr {
    background-color: transparent !important;
  }
  
  td.el-table__cell,
  th.el-table__cell.is-leaf {
    background-color: transparent !important;
    border-bottom: 1px solid var(--light-border) !important;
  }
  
  .el-table__body {
    background-color: transparent !important;
  }
}

.filter-card {
  border: 1px solid var(--border-color) !important;
  position: relative;
  overflow: hidden;
  background-color: transparent !important;
  
  &::after, &::before {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.3rem;
  }
  
  .filter-item {
    margin-bottom: 8px;
  }
  
  .log-data-container {
    padding: 10px;
  }
}

:deep(.dark-input) {
  min-width: 160px;
  background-color: #232323; 
  border-radius: 6px;         
  
  .el-input__inner {
    background-color: transparent !important;
    color: var(--text-color) !important;
    border-color: #444 !important;
  }
}

:deep(.el-progress-bar__outer) {
  background-color: #23272f !important;
}
</style> 