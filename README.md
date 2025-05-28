 

# run
    npm run serve

# build
    npm run build

# publish
    git add .
    git commit -m"xx"
    git push origin main


# 访问
https://jieniliu.github.io/sdm_log_preview/






参数：eventid,userid,roomid

找到每个launch的消息  把launch的数据存成一条数据 （）
socket_disconnected  socket断开次数
will_finish_launching  应用启动次数
display_room   进入房间次数

will_finish_launching socket_connected 每次启动的socket链接耗时 确保launch id一致

send_message 发消息次数   【区分消息类型，文本，图片，视频，拼图，文件，语音】
send_message_success 发消息成功次数 
send_message_faild 发消息失败次数




# postgres 数据表内容：
type SdmLogUpload struct {
	SdnUrl       string `gorm:"column:sdn_url;" json:"sdn_url"`
	TraceId      string `gorm:"column:trace_id;" json:"trace_id"`
	UserId       string `gorm:"column:user_id;" json:"user_id"`
	Platform     string `gorm:"column:platform;" json:"platform"`
	DeviceId     string `gorm:"column:device_id;" json:"device_id"`
	LaunchId     string `gorm:"column:launch_id;" json:"launch_id"`
	ActionType   string `gorm:"column:action_type;" json:"action_type"`
	RoomId       string `gorm:"column:room_id;" json:"room_id"`
	EventType    string `gorm:"column:event_type;" json:"event_type"`
	MessageType  string `gorm:"column:message_type;" json:"message_type"`
	LocalEventId string `gorm:"column:local_event_id;" json:"local_event_id"`
	EventId      string `gorm:"column:event_id;" json:"event_id"`
	Other        string `gorm:"column:other;" json:"other"`
	Timestamp    int64  `gorm:"column:timestamp;" json:"timestamp"`
}

# 消息时间计算 

同时有local_event_id和event_id 的log
send_message_success
store_timeline_event
roaming_receive_message
add_timeline_event_to_datasource
sync_online_receive_message

目前在用的接口方法：
一：[在线的收消息情况]
接口方法：[GetMessageDelayAvgDuration]
二：[漫游的情况]
接口方法：[GetRoamingMessageAVGDuration]
三：[发送附件消息]
接口方法：[AttachmentMessageAVGDurations]
四：[发送文本消息]
接口方法:[GetTextMessageAVGTime]

五：[基本信息统计]   包括发消息，发图片等的次数统计
接口方法：[]

把起始点

起始点：sync_online_receive_message
中间点：
结束点：send_message_success

先找出所有action_type=sync_online_receive_message和send_message_success的log，
遍历一遍，用event_id为key，把event_id相同的log放到一个数组里面按照时间从小到大排序作为value 组成nsdictionary结构
遍历每个数组，判断数组长度是否是2，如果不是2打印出数组详细信息，如果sync_online_receive_message时间大于send_message_success的时间，让其相减得到一个时间差，然后把这个时间差加到一个数组里面，最后把这个数组里面的所有时间差求平均值


二：[漫游的情况]
接口方法：[GetRoamingMessageAVGDuration]
起始点： roaming_receive_message
结束点：socket_connected

先找出所有action_type=roaming_receive_message和socket_connected的log，
遍历一遍，用launch_id为key，把launch_id相同的log到一个数组里面按照时间从小到大排序作为value 组成nsdictionary结构
遍历之前定义一个变量current_socket_time,遍历每个数组，如果action_type=socket_connected，则把current_socket_time设置成当前log的时间，每次碰到action_type=roaming_receive_message，就用当前log的时间减current_socket_time，得到一个时间差，然后把这个时间差加到一个数组里面，最后把这个数组里面的所有时间差求平均值

# 发消息：

[附件：updaload，send_message_success]
参数message_type = m.image 则upload为upload_image, uploadsuccess为upload_image_success
参数message_type = m.video 则upload为upload_video, uploadsuccess为upload_video_success
参数message_type = m.file 则upload为upload_file, uploadsuccess为upload_file_success
参数message_type = m.audio 则upload为upload_file, uploadsuccess为upload_file_success
参数message_type = m.gallery 则upload为upload_gallery_list, uploadsuccess为upload_gallery_list_success
参数message_type = m.gif 则upload为upload_image, uploadsuccess为upload_image_success
参数message_type = m.sticker 则upload为upload_image, uploadsuccess为upload_image_success

查出所有的action_type= updaload , uploadsuccess,send_message，send_message_success的log，
遍历所有记录
1：建一个dictionary 名字叫eventRelation把key设置成event_id，把value设置成local_event_id,
第二次遍历所有记录
2，再建一个dictionary，把key设置成event_id,把event_id以及eventRelation中的local_event_id对应的action_type=updaload， uploadsuccess，send_message_success的log放入数组作为value

需要计算upload 到 uploadsuccess 的时间求平均得到uploadAVGTime
需要计算send_message 到 send_message_success的时间求平均得到sendMessageApiAVGTime
需要计算upload到send_message_success的时间求平均得到sendMessageTotalAVGTime
这个方法返回三个时间分别为uploadAVGTime,sendMessageApiAVGTime,sendMessageTotalAVGTime


[文本：send_message,send_message_success]

查出所有的message_type = m.text, action_type= send_message ,encrypt_event， encrypt_event_success,send_message_success的log，
遍历所有记录
1：建一个dictionary 名字叫eventRelation把key设置成event_id，把value设置成local_event_id,
第二次遍历所有记录
2，再建一个dictionary，把key设置成event_id,把event_id以及eventRelation中的local_event_id对应的action_type=send_message ,encrypt_event， encrypt_event_success,send_message_success的log放入数组作为value

需要计算 encrypt_event 到 encrypt_event_success 的时间取平均值 encryptAVGTime, 
需要计算 send_message 到 send_message_success 的时间求平均得到sendMessageApiAVGTime





【七： 通过userid查询所有log，按照时间进行排序】
func GetUserLogList(ctx context.Context, start, end int64, eventType string) (float64, error) {
db := GetDb(ctx, config.Config.DatabaseAuth)


【六：任意两个事件的平均时间】
需求都是统计一个时间段内的数据，start，end为必选参数
参数：需要根据参数MessageType（m.image, m.video, m.audio, m.gallery）解析出两个事件ActionType，对应关系如下
m.image：upload_image , max(upload_image_success,upload_thumbnail_image_success)
m.video：upload_video , max(upload_video_success,upload_thumbnail_video_success)
m.file：upload_file , upload_file_success
m.audio：upload_file , upload_file_success
m.gallery：upload_gallery_list , upload_gallery_list_success
条件：MessageType相同， 参与计算的launchid 和 LocalEventId 必须相等

在相同的MessageType和launchid下计算所有LocalEventId对应的上述事件之间耗时平均值
1,sql查出数据放入一个map
localevnetMap = {
	LocalEventId1:[actiontype1,actiontype2,actiontype3],
	LocalEventId2:[actiontype1,actiontype2,actiontype3,actiontype4]
}
2，计算各个事件节点下的时间求平均
avgtime = (time1(actiontype2 - actiontype1) + time2(actiontype2 - actiontype1) .... )/n
3，方法名和参数：
func GetAttachmentFileAvgDuration(ctx context.Context, start, end int64, eventType string) (float64, error) {
db := GetDb(ctx, config.Config.DatabaseAuth)

【五：发送成功到sync回来的时间】
统计从ActionType=send_message_success 到 ActionType=add_timeline_event_to_datasource的平均耗时，他们有相同的event_id有相同的launchid，需要按照时间段查询，需要根据MessageType（m.text，m.image）来区分各自的统计情况，MessageType作为参数每次只能传一个值，返回的结果是一个数值，




【四：消息发送成功的耗时】
前提：需要按照时间段查询，需要根据EventType（m.text，m.image）来区分各自的统计情况，
EventType作为参数每次只能传一个值，返回的结果是一个数值，
计算ActionType=send_message 和 ActionType=send_message_success的时间差，计算平均值
他们通过local_event_id和event_id来关联，当ActionType=send_message时只有local_event_id有值，当ActionType=send_message_success时，local_event_id和event_id都有值，只统计他们有相同的launchid部分数据



m.text
m.image

【一：求socket链接时间】
在LaunchId相等时计算ActionType=will_finish_launching ActionType=socket_connected 的时间差值作为socket链接响应时间，然后求平均值

【二：求单一事件的时间】
下面所有需求都是在一个时间段内计算，最好合并到一个方法中
一：计算ActionType = socket_disconnected 的记录数量【socket断开次数】
二：计算ActionType = will_finish_launching 的记录数量【启动次数】
三：计算ActionType = display_room的记录数量【进入房间的数量】
四：计算ActionType = send_message的记录数量【发消息数量】
五：计算ActionType = send_message_success的记录数量【消息发送成功数量】
六：计算ActionType = send_message_faild的记录数量【消息发送失败数量】

【三：统计当天在线人数】
统计一段时间内的DeviceId的数量
