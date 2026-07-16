# 干道绿波优化原理及计算方法

[1.经典数解法](https://www.roadgee.com/doc/band#m0)[2.优化数解法](https://www.roadgee.com/doc/band#m1)[3.图解法](https://www.roadgee.com/doc/band#m2)[4.单向干线协调控制](https://www.roadgee.com/doc/band#m3)

## 1.经典数解法

**经典数解法** 是双向干线协调控制中最知名的算法，其计算过程分为两个步骤。

第一步，计算最佳理想信号间距（半周期长度，v\*C/2，a值）。根据初始设定的周期C和速度v，计算a0=v\*C/2，以a0为中心值、以10米为步长，上下各枚举10个值（a1=a0-10，a2=a0+10...a1=a19-100，a20=a0+100），分别计算对应b值，则最大b值对应a为最佳值。

第二步，根据第一步确定的a值和间距计算各交叉口相位差，结合交叉口绿信比（λ）计算带宽。

详细过程请观看《 [双向绿波设计的数解法](https://open.163.com/newview/movie/free?pid=QHIHN67NG&mid=SHIHN7CGA)》、《 [干线信号协调控制数解法结果分析](https://open.163.com/newview/movie/free?pid=QHIHN67NG&mid=AHIHN6PJ4)》。

**例1**　干道上行方向有5个信号交叉口，间距分别为680米、520米、360米、660米，各交叉口的绿信比分别为45%、50%、60%、40%、 55%. 公共周期C为90秒，设计车速为36km/h。点击查看《 [例1-经典数解法](https://www.roadgee.com/band/?Bid=1)》。

![RoadGee干道绿波绘制软件](https://www.roadgee.com/static/dist/doc/imgs/band1.png?t=250125)

按照上图在RoadGee中输入相关参数，优化方案选择`经典数解法`，点击`一键优化`按钮。

![双向干线协调控制经典数解法](https://www.roadgee.com/static/dist/doc/imgs/band2.png?t=250125)

软件计算出的最佳半周期长度为520米，带宽为29.62%，同时设置了各相位的绝对 **相位差**，并自动绘图。可以看到右侧时空图计算的带宽为26.7s与数解法结算的带宽比29.62%\*90s=26.658s一致。

`一键优化`后软件会锁定`vc/2`，根据`公共周期`计算`标准带速`，并设置各交叉口的上下行速度。

`相位差`默认以`比值模式`显示，可点击标题切换为`数值模式`，`数值模式`为固定值不会随周期变化而变化。

## 2.优化数解法

**经典数解法** 第一步没有考虑各信号的绿信比，在干道规模小、绿信比普遍较大的情况下，最优解与数解法得到的解相近。对于交叉口数量多或存在瓶颈路口的情况，绿信比成为影响最优解的重要因素，最优解不再是数解法得到的结果[\[1\]](https://www.roadgee.com/doc/band#ref1)。

点击查看《 [例1-优化数解法](https://www.roadgee.com/band/?Bid=2)》。

在例1中，当a=510米时，带宽比为30.84%，干道绿波计算带宽为27.8s，结果优于数解法的计算结果(a=520米)。

《 [双向干线协调控制的改进数解算法](https://www.roadgee.com/doc/band#ref1)》针对经典数解法不能确保得到最优解的问题，提出新的改进数解算法。改进后的数解算法相比经典数解法，可以得到最大绿波带宽。

RoadGee并未使用文中的改进算法，而是利用计算机便捷的算力，分别计算a0至a20对应的带宽，直接取最大值。

在例1中将优化方案修改为`优化数解法`，然后再`一键优化`，计算的a值为510米，带宽比为30.84%。

![RoadGee干道绿波绘制软件](https://www.roadgee.com/static/dist/doc/imgs/band3.png?t=250125)

在实际应用中建议采用RoadGee提供的 **优化数解法** 进行优化。

## 3.图解法

详细图解法教程，请观看视频《 [双向绿波相位差确定的图解法](https://open.163.com/newview/movie/free?pid=QHIHN67NG&mid=IHIHN87EM)》。

RoadGee根据输入的 **标准带速** 在干道绿波中绘制两条 **辅助线**，在文本框 **标准带速** 获得焦点后，通过滚动鼠标可改变值，利用 **辅助线** 可实现图解法功能。

![双向干线协调控制图解法](https://www.roadgee.com/static/dist/doc/imgs/band4.png?t=250125)

## 4.单向干线协调控制

在单向干线协调控制中，RoadGee使用公式距离/速度=相位差进行计算。

### 参考文献

\[1\] [曾佳棋,王殿海.双向干线协调控制的改进数解算法\[J\].浙江大学学报(工学版),2020,54(12):2386-2394.](https://www.zjujournals.com/eng/article/2020/1008-973X/202012013.shtml)

* * *

上一篇： [交叉口服务水平评价表](https://www.roadgee.com/doc/service_level)下一篇： [干道绿波中优化方案选择](https://www.roadgee.com/doc/band_method)

![RoadGee微信](https://www.roadgee.com/static/dist/imgs/ewm1.jpg)

客服微信

©2020-2026 [roadgee.com](https://www.roadgee.com/) 版权所有 [苏ICP备2025153882号-2](https://beian.miit.gov.cn/)

×

#### 软件介绍

1. [交叉口设计分析软件](https://www.roadgee.com/doc/index)
2. [道路横断面设计软件](https://www.roadgee.com/doc/index?a=m1#m1)
3. [干道绿波设计软件](https://www.roadgee.com/doc/index?a=m2#m2)

#### 用户管理

1. [用户注册](https://www.roadgee.com/doc/user_reg)
2. [用户激活](https://www.roadgee.com/doc/user_active)
3. [密码找回](https://www.roadgee.com/doc/user_forget)
4. [授权码](https://www.roadgee.com/doc/user_code)
5. [自助开票](https://www.roadgee.com/doc/user_fp)
6. [微信绑定](https://www.roadgee.com/doc/user_wx)

#### 项目管理

1. [创建项目](https://www.roadgee.com/doc/project_new)
2. [项目查询](https://www.roadgee.com/doc/project_search)
3. [项目排序](https://www.roadgee.com/doc/project_order)
4. [删除项目](https://www.roadgee.com/doc/project_delete)
5. [复制/分享项目](https://www.roadgee.com/doc/project_share)
6. [导出Vissim仿真文件](https://www.roadgee.com/doc/vissim)

#### 进口道路设置

1. [增加道路](https://www.roadgee.com/doc/rad_add)
2. [修改道路](https://www.roadgee.com/doc/rad_edit)
3. [删除道路](https://www.roadgee.com/doc/rad_delete)

#### 渠化设计

01. [新增/复制渠化方案](https://www.roadgee.com/doc/channel)
02. [切换道路属性](https://www.roadgee.com/doc/switch_road)
03. [交叉口大小](https://www.roadgee.com/doc/channel_radius)
04. [右转曲度](https://www.roadgee.com/doc/channel_curvity)
05. [道路名称](https://www.roadgee.com/doc/road_name)
06. [偏移量](https://www.roadgee.com/doc/road_offset)
07. [穿越属性：设置右进右出](https://www.roadgee.com/doc/cross)
08. [路段速度](https://www.roadgee.com/doc/speed)
09. [人行横道/人行横道宽度](https://www.roadgee.com/doc/footwalk)
10. [左转待转/直行待行](https://www.roadgee.com/doc/turn_wait)
11. [借道左转](https://www.roadgee.com/doc/borrow_left)
12. [红灯时右转](https://www.roadgee.com/doc/red_turn_right)
13. [右转渠化](https://www.roadgee.com/doc/channel_turn_right)
14. [进口车道数](https://www.roadgee.com/doc/enter_road_num)
15. [进口展宽数](https://www.roadgee.com/doc/enter_widen_num)
16. [进口车道宽度/展宽车道宽度](https://www.roadgee.com/doc/enter_road_width)
17. [进口展宽段长/外侧渐变段长](https://www.roadgee.com/doc/enter_ls)
18. [进口内侧偏移/内侧渐变段长](https://www.roadgee.com/doc/median_offset)
19. [出口车道数](https://www.roadgee.com/doc/exit_road_num)
20. [出口展宽数](https://www.roadgee.com/doc/exit_widen_num)
21. [出口车道宽度/展宽车道宽度](https://www.roadgee.com/doc/exit_road_width)
22. [出口展宽段长/渐变段长](https://www.roadgee.com/doc/exit_ls)
23. [中央隔离-分割形式/分割带宽](https://www.roadgee.com/doc/median_spliter)
24. [安全岛](https://www.roadgee.com/doc/island)
25. [提前掉头](https://www.roadgee.com/doc/reverse)
26. [非机动车道](https://www.roadgee.com/doc/bike_lane)
27. [辅路设置](https://www.roadgee.com/doc/relief_road)
28. [进口倾斜/出口倾斜](https://www.roadgee.com/doc/bias)
29. [左转/右转角度范围](https://www.roadgee.com/doc/turn_angle)
30. [高亮显示当前道路](https://www.roadgee.com/doc/high_light)
31. [转向标志](https://www.roadgee.com/doc/turn_type)
32. [可变车道](https://www.roadgee.com/doc/turn_var)
33. [渠化背景色](https://www.roadgee.com/doc/channel_color)
34. [指北针](https://www.roadgee.com/doc/compass)

#### 流量方案

1. [新增/复制流量方案](https://www.roadgee.com/doc/flow)
2. [流量输入](https://www.roadgee.com/doc/flow_num)
3. [绘图属性](https://www.roadgee.com/doc/flow_prop)
4. [大车比例](https://www.roadgee.com/doc/flow_big_car)
5. [高峰小时系数（PHF）](https://www.roadgee.com/doc/flow_phf)
6. [饱和流率](https://www.roadgee.com/doc/flow_sat)

#### 信号控制方案

01. [新增/复制信号控制方案](https://www.roadgee.com/doc/signal)
02. [相位总数](https://www.roadgee.com/doc/phase_num)
03. [周期](https://www.roadgee.com/doc/phase_cycle)
04. [相位尺寸/道路宽度](https://www.roadgee.com/doc/phase_size)
05. [图例](https://www.roadgee.com/doc/phase_legend)
06. [相位属性：名称/绿灯/黄灯/全红](https://www.roadgee.com/doc/phase_prop)
07. [搭接相位](https://www.roadgee.com/doc/phase_dj)
08. [设置相位](https://www.roadgee.com/doc/phase_setup)
09. [相位顺序调整](https://www.roadgee.com/doc/phase_move)
10. [查看相位大图](https://www.roadgee.com/doc/phase_zoom)
11. [自动配时](https://www.roadgee.com/doc/auto_timing)
12. [方案生成](https://www.roadgee.com/doc/signal_create)
13. [方案清空](https://www.roadgee.com/doc/signal_clear)
14. [无信号控制交叉口](https://www.roadgee.com/doc/signal_none)

#### 评价分析

1. [交叉口饱和度评价分析](https://www.roadgee.com/doc/vc)
2. [交叉口延误时间评价分析](https://www.roadgee.com/doc/delay)
3. [交叉口排队长度评价分析](https://www.roadgee.com/doc/queue)
4. [交叉口服务水平评价分析](https://www.roadgee.com/doc/service_level)
5. [多方案对比分析](https://www.roadgee.com/doc/compare)
6. [评价分析结果导出](https://www.roadgee.com/doc/export_excel)

#### 其他功能

1. [地图模式操作说明](https://www.roadgee.com/doc/map)
2. [画布尺寸调整](https://www.roadgee.com/doc/canvas_size)
3. [下载图片](https://www.roadgee.com/doc/export_img)

#### 计算原理

1. [交叉口饱和度计算](https://www.roadgee.com/doc/vc)
2. [交叉口延误时间计算](https://www.roadgee.com/doc/delay)
3. [交叉口排队长度计算](https://www.roadgee.com/doc/queue)
4. [交叉口信号配时计算](https://www.roadgee.com/doc/timing)
5. [交叉口服务水平评价表](https://www.roadgee.com/doc/service_level)

#### 干道绿波

1. [优化原理及计算方法](https://www.roadgee.com/doc/band)
2. [优化方案选择](https://www.roadgee.com/doc/band_method)

#### 示例演示

1. [十字交叉口-两相位信号控制](https://www.roadgee.com/doc/example1)
2. [早启迟断式信号控制（搭接相位）](https://www.roadgee.com/doc/example2)
3. [《交通管理与控制》例题演示](https://www.roadgee.com/doc/example3)
4. [《城市交通管理与控制》例题演示](https://www.roadgee.com/doc/example4)

#### 优惠活动

1. [教育优惠](https://www.roadgee.com/doc/education)
2. [科研激励活动](https://www.roadgee.com/doc/paper)
3. [视频创作活动](https://www.roadgee.com/doc/activity)

×

![](https://www.roadgee.com/doc/band)

关闭