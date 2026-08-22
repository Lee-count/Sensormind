## Vibe
- Engineering Blueprint Minimalism: clean technical surfaces, electric-blue-to-cyan gradients as functional accents, and crisp card-based organization inspired by engineering schematics.

## Color
- Primary: #0066FF
- On Primary: #FFFFFF
- Accent: #00B4D8
- On Accent: #FFFFFF
- Background: #FFFFFF
- Foreground: #0F172A
- Muted: #F8F9FA
- Border: #E2E8F0
- Secondary: #64748B

## Typography
- Heading: 阿里巴巴普惠体 (family: "Alibaba PuHuiTi", weight: 600, url: https://resource-static.bj.bcebos.com/fonts-skill/AlibabaPuHuiTi_SemiBold.ttf)
- Body: 阿里巴巴普惠体 (family: "Alibaba PuHuiTi", weight: 400, url: https://resource-static.bj.bcebos.com/fonts-skill/AlibabaPuHuiTi_Regular.ttf)

## Visual Language
- 核心视觉签名：电光蓝到青色渐变作为功能焦点，用于主按钮、品牌标题高亮和选中态指示条，在纯白背景上形成清晰的科技工程感。
- 材质与深度：纯白页面背景，浅灰 (#F8F9FA) 卡片底色，使用细边框和极淡投影区分层级，拒绝玻璃拟态与深色模式。
- 容器与按钮：卡片使用大圆角与充足内边距；主按钮采用蓝到青渐变填充、白字；次按钮使用浅灰底色；所有可点击区域保持大触控面积。
- 布局节奏：移动优先的纵向流式布局，场景卡片网格在桌面展开为多列；关键操作按钮固定于页面底部或卡片底部，保证单手可达。

## Animation
- 入场：场景卡片与对话消息采用淡入 + 轻微上浮 (translate-y) 的交错出场。
- 交互：场景卡片 hover 时轻微上浮并扩展阴影；按钮点击时使用 active:scale-95 反馈。
- 状态：保存方案成功后，对勾图标做缩放 + 渐显动画，并伴随 toast 提示。

## Forbidden
- 深色背景、玻璃拟态、霓虹光晕装饰
- 大色块纯色铺底或大面积渐变背景
- 使用 Emoji 作为图标或装饰
