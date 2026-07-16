# 例1：十字交叉口-两相位信号控制

[1.设置渠化方案](https://www.roadgee.com/doc/example1#m0)[2.输入交通流量](https://www.roadgee.com/doc/example1#m1)[3.设置信号控制方案，并输入配时参数](https://www.roadgee.com/doc/example1#m2)[4.自动配时](https://www.roadgee.com/doc/example1#m3)[5.饱和度计算结果](https://www.roadgee.com/doc/example1#m4)[6.延误计算结果](https://www.roadgee.com/doc/example1#m5)[7.排队长度计算结果](https://www.roadgee.com/doc/example1#m6)

* * *

使用RoadGee软件实现 [《交通管理与控制（第二版）》](https://product.dangdang.com/25231791.html) 例8-3和9-3的计算，P226，P282。

网易公开课计算过程讲解地址： [网易公开课：《信号交叉口通行能力计算及实例分析》](https://open.163.com/newview/movie/free?pid=QHIHN67NG&mid=AHIHN9S8M)

项目地址： [例8-3和9-3](https://www.roadgee.com/design/?pid=9259)，所有RoadGee用户登录后均可查该看该示例。

## 1.设置渠化方案

![交通渠化方案](https://www.roadgee.com/static/dist/doc/imgs/example1/1.png?t=250125)

## 2.输入交通流量

根据题目输入车流量，并将 **大车比例** 设置为0， **高峰小时系数** 设置为1。

南北进口车道 **饱和流率** 设置为2400pcu/h，东西进口车道 **饱和流率** 设置为1000pcu/h。

![交通流量图](https://www.roadgee.com/static/dist/doc/imgs/example1/2.png?t=250125)

## 3.设置信号控制方案，并输入配时参数

设计目标饱和度为0.9，信号损失为3s，高峰小时系数为1。

![交通信号控制方案](https://www.roadgee.com/static/dist/doc/imgs/example1/3.png?t=250125)

## 4.自动配时

点击 `自动配时` 按钮，软件自动计算Y值（0.74）和周期时长（78.75s），并计算各相位`最佳绿灯显示时间`。

软件计算过程保留小数点，只在最终显示时取整，计算结果分别为39s、26s与例题一致（四舍五入取整后有些许差异）。

![交通信号控制方案](https://www.roadgee.com/static/dist/doc/imgs/example1/4.png?t=250125)

为了验证软件的计算结果，将以含小数点的绿灯时间演示饱和度、延误和排队等指标的计算。

![交通信号控制方案](https://www.roadgee.com/static/dist/doc/imgs/example1/5.png?t=250125)

## 5.饱和度计算结果

饱和度计算结果与例题一致。同时可以看到南进口和西进口为2个相位的 **关键车道组**（关键流率比对应的车道组），计算结果与 **设计目标饱和度**（0.9）一致。

![交叉口饱和度计算](https://www.roadgee.com/static/dist/doc/imgs/example1/6.png?t=250125)

![交叉口饱和度计算](https://www.roadgee.com/static/dist/doc/imgs/example1/7.png?t=250125)

## 6.延误计算结果

延误计算结果与例题一致。

![交叉口延误计算](https://www.roadgee.com/static/dist/doc/imgs/example1/8.png?t=250125)

![交叉口延误计算](https://www.roadgee.com/static/dist/doc/imgs/example1/9.png?t=250125)

## 7.排队长度计算结果

![交叉口排队长度计算](https://www.roadgee.com/static/dist/doc/imgs/example1/10.png?t=250125)

* * *

上一篇： [干道绿波中优化方案选择](https://www.roadgee.com/doc/band_method)下一篇： [早启迟断式信号控制（搭接相位）](https://www.roadgee.com/doc/example2)

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

![](https://www.roadgee.com/doc/example1)

关闭