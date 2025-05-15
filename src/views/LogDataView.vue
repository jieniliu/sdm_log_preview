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
            >
              <el-option label="文本消息" value="m.text" />
              <el-option label="图片消息" value="m.image" />
              <el-option label="视频消息" value="m.video" />
              <el-option label="语音消息" value="m.voice" />
              <el-option label="文件消息" value="m.file" />
            </el-select>
          </div>
          
          <div class="filter-item">
            <span class="filter-label">用户ID：</span>
            <el-input
              v-model="filters.userId"
              placeholder="请输入用户ID"
              clearable
              size="small"
              class="dark-input"
            />
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
        <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
          <div class="custom-metric-card">
            <div class="metric-value">{{ logData.user_count || 0 }}</div>
            <div class="metric-title">用户数量</div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
          <div class="custom-metric-card">
            <div class="metric-value">{{ formatNumber(logData.message_send_avg_time || 0) }}</div>
            <div class="metric-title">消息发送耗时 (ms)</div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
          <div class="custom-metric-card">
            <div class="metric-value">{{ formatNumber(logData.avg_socket_time?.average_response_time || 0) }}</div>
            <div class="metric-title">Socket响应时间 (ms)</div>
          </div>
        </el-col>
      </el-row>
      
      <!-- 表格区域 -->
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <el-card class="table-card custom-table-card">
            <template #header>
              <div class="card-header">
                <h3>操作统计</h3>
              </div>
            </template>
            <div class="table-wrapper">
              <el-table 
                :data="actionTypeData" 
                size="small" 
                stripe 
                style="width: 100%"
                highlight-current-row
                :row-class-name="highlightActionRows"
                row-key="key"
                class="dark-table custom-border-table no-header-line"
                header-row-class-name="table-header-row"
              >
                <el-table-column prop="name" label="事件" min-width="120" />
                <el-table-column prop="value" label="数值" width="100" align="right" />
                <el-table-column prop="key" label="字段" min-width="140" class-name="field-column" />
              </el-table>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <el-card class="table-card custom-table-card">
            <template #header>
              <div class="card-header">
                <h3>耗时统计</h3>
              </div>
            </template>
            <div class="table-wrapper">
              <el-table 
                :data="timeData" 
                size="small" 
                stripe 
                style="width: 100%" 
                highlight-current-row
                :row-class-name="highlightTimeRows"
                row-key="key"
                class="dark-table custom-border-table no-header-line"
                header-row-class-name="table-header-row"
              >
                <el-table-column prop="name" label="事件" min-width="120" />
                <el-table-column prop="value" label="数值 (ms)" width="100" align="right" />
                <el-table-column prop="key" label="字段" min-width="140" class-name="field-column" />
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import api from '../services/api'

export default {
  name: 'LogDataView',
  data() {
    return {
      filters: {
        startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 默认7天前
        endTime: Date.now(),
        messageType: '',
        userId: ''
      },
      logData: {
        action_type_count: {
          socket_disconnected_count: 0,
          launch_count: 0,
          enter_room_count: 0,
          send_message_count: 0,
          send_success_count: 0,
          send_fail_count: 0
        },
        avg_socket_time: {
          average_response_time: 0
        },
        user_count: 0,
        message_send_avg_time: 0,
        send_to_sync_avg: 0
      }
    }
  },
  computed: {
    actionTypeData() {
      return [
        { name: '启动次数', value: this.logData.action_type_count?.launch_count || 0, key: 'launch_count' },
        { name: 'socket断开次数', value: this.logData.action_type_count?.socket_disconnected_count || 0, key: 'socket_disconnected_count' },
        { name: '进入房间次数', value: this.logData.action_type_count?.enter_room_count || 0, key: 'enter_room_count' },
        { name: '发消息次数', value: this.logData.action_type_count?.send_message_count || 0, key: 'send_message_count' },
        { name: '消息发送成功次数', value: this.logData.action_type_count?.send_success_count || 0, key: 'send_success_count' },
        { name: '消息发送失败次数', value: this.logData.action_type_count?.send_fail_count || 0, key: 'send_fail_count' }
      ]
    },
    timeData() {
      return [
        { name: 'socket链接时长', value: this.formatNumber(this.logData.avg_socket_time?.average_response_time || 0), key: 'avg_socket_time' },
        { name: '发消息耗时', value: this.formatNumber(this.logData.message_send_avg_time || 0), key: 'avg_sendmessage_time' },
        { name: 'sync回消息耗时', value: this.formatNumber(this.logData.send_to_sync_avg || 0), key: 'send_to_sync' }
      ]
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      try {
        const response = await api.getLogSummary(
          this.filters.startTime,
          this.filters.endTime,
          this.filters.messageType,
          this.filters.userId
        )
        this.logData = response.data
      } catch (error) {
        console.error('获取日志数据失败:', error)
        this.$message.error('获取数据失败，请稍后重试')
      }
    },
    formatNumber(value) {
      // 确保数值类型并保留一位小数
      return Number(value).toFixed(1)
    },
    highlightSocketRow({ row }) {
      if (row.key === 'socket_disconnected_count') {
        return 'highlighted-row'
      }
      return ''
    },
    highlightSendMessageRow({ row }) {
      if (row.key === 'avg_sendmessage_time') {
        return 'highlighted-row'
      }
      return ''
    },
    highlightActionRows({ row }) {
      if (row.key === 'send_message_count' || row.key === 'send_fail_count') {
        return 'highlighted-row'
      }
      return ''
    },
    highlightTimeRows({ row }) {
      if (row.key === 'avg_sendmessage_time') {
        return 'highlighted-row'
      }
      return ''
    }
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
  height: 120px;
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
  justify-content: space-between;
  align-items: center;
}

.metric-card-label {
  font-size: 1rem;
  color: var(--text-secondary);
}

.metric-card-value {
  font-size: 1.25rem;
  color: var(--text-color);
  font-weight: 500;
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
  
  .el-input__inner {
    background-color: #232323 !important;
    color: var(--text-color) !important;
    border-color: #444 !important;
  }
}
</style> 