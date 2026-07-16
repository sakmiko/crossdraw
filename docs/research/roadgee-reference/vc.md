# 交叉口饱和度计算

[1.绿信比](https://www.roadgee.com/doc/vc#m0)[2.进口车道（或车道组）饱和度](https://www.roadgee.com/doc/vc#m1)[3.交叉口平均饱和度](https://www.roadgee.com/doc/vc#m2)[4.其他计算细节](https://www.roadgee.com/doc/vc#m3)[5.基于饱和度指标的服务水平评价](https://www.roadgee.com/doc/vc#m4)

## 1.绿信比

**绿信比** 是指一个信号周期内某相位的 **有效绿灯时长** 与 **信号周期时长** 的比值，一般用λ表示：

![绿信比计算公式](https://www.roadgee.com/static/dist/doc/imgs/formula_lambda.png?t=250125)

式中：

**gE** 有效绿灯时长，s；

**C** 信号周期时长，s；

**g** 绿灯显示时间，s；

**A** 黄灯时间，s；

**l** 启动损失时间，s。

在RoadGee中默认黄灯时间为3s，启动损失时间为3s，即有效绿灯时长=显示绿灯时间（参数可在软件中调整）。

## 2.进口车道（或车道组）饱和度

**饱和度** 指进口车道 **实际交通量** 与进口车道 **通行能力** 的比值，通行能力等于进口车道的 **饱和流率** 与 **绿信比** 的乘积。因此，饱和度可以表达为如下形式：

![进口车道（或车道组）饱和度计算公式](https://www.roadgee.com/static/dist/doc/imgs/formula_vc1.png?t=250125)

式中：

**V** 进口车道实际交通量，pcu/h；

**CAP** 进口车道通行能力，pcu/h；

**S** 进口车道饱和流率，pcu/h；

**λ** 进口车道绿信比。

为了应对高峰小时的需求波动，RoadGee使用 **高峰小时交通量** 来计算饱和度，公式如下：

![进口车道（或车道组）饱和度计算公式](https://www.roadgee.com/static/dist/doc/imgs/formula_vc2.png?t=250125)

式中：

**q** 进口车道高峰小时交通量；

**PHF** 进口车道高峰小时流量系数。

## 3.交叉口平均饱和度

**交叉口平均饱和度** 取各进口车道饱和度以进口车道流量为权的加权平均值。

![交叉口平均饱和度计算公式](https://www.roadgee.com/static/dist/doc/imgs/formula_vc3.png?t=250125)

式中：

**xi** 进口车道i高峰小时饱和度；

**qi** 进口车道i高峰小时交通量，pcu/h。

## 4.其他计算细节

（1）在RoadGee中输入的 **转向流量** 为 **实际交通量** V，软件根据 **大车比例** 将V折算为 **标准车当量数**（pcu），若无需折算可将大车比例设置为0。

（2）RoadGee计算的是 **高峰小时状态** 下的饱和度，若不需要可将PHF设置为1（默认为0.95）。

（3）RoadGee未对转向流量进行直行当量转化。

## 5.基于饱和度指标的服务水平评价

交叉口 **饱和度** 数值与 **服务水平** 的对应关系见《 [交叉口服务水平评价表](https://www.roadgee.com/doc/service_level)》。

![交叉口饱和度评价分析](https://www.roadgee.com/static/dist/doc/imgs/analyse/vc.png?t=250125)

* * *

上一篇： [无信号控制交叉口](https://www.roadgee.com/doc/signal_none)下一篇： [交叉口延误时间评价分析](https://www.roadgee.com/doc/delay)

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

![](https://www.roadgee.com/doc/vc)

关闭