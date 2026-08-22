import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

from reportlab.pdfgen import canvas

# 注册中文字体
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))

class PageNumCanvas(canvas.Canvas):
    """带页码和页眉页脚的 Canvas 回调类"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self.pages)
        for page in self.pages:
            self.__dict__.update(page)
            if self._pageNumber > 1:
                self.saveState()
                self.setFont('STSong-Light', 9)
                self.setFillColor(colors.HexColor('#6B7280'))

                # 页眉
                self.drawString(2 * cm, 28.2 * cm, "SensorMind 物联网设备选型助手Web应用 — 应用方案")
                self.setStrokeColor(colors.HexColor('#E5E7EB'))
                self.setLineWidth(0.5)
                self.line(2 * cm, 28.0 * cm, 19 * cm, 28.0 * cm)

                # 页脚
                page_text = f"第 {self._pageNumber} 页 / 共 {num_pages} 页"
                self.drawRightString(19 * cm, 1.2 * cm, page_text)
                self.drawString(2 * cm, 1.2 * cm, "基于 秒哒/DuMate 平台构建 | AI 驱动型 IoT 选型")
                self.line(2 * cm, 1.6 * cm, 19 * cm, 1.6 * cm)

                self.restoreState()
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2.2 * cm,
        bottomMargin=2.2 * cm
    )

    styles = getSampleStyleSheet()

    # 自定义样式
    primary_color = colors.HexColor('#2563EB')
    dark_color = colors.HexColor('#111827')
    gray_color = colors.HexColor('#4B5563')
    light_bg = colors.HexColor('#F8FAFC')
    accent_blue = colors.HexColor('#EFF6FF')

    title_style = ParagraphStyle(
        'CoverTitle',
        fontName='STSong-Light',
        fontSize=26,
        leading=34,
        textColor=primary_color,
        alignment=1, # Center
        spaceAfter=15
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        fontName='STSong-Light',
        fontSize=15,
        leading=22,
        textColor=gray_color,
        alignment=1,
        spaceAfter=30
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        fontName='STSong-Light',
        fontSize=16,
        leading=22,
        textColor=primary_color,
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        fontName='STSong-Light',
        fontSize=13,
        leading=18,
        textColor=dark_color,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        fontName='STSong-Light',
        fontSize=10,
        leading=16,
        textColor=dark_color,
        spaceAfter=8,
        firstLineIndent=20
    )

    body_no_indent = ParagraphStyle(
        'BodyNoIndent',
        fontName='STSong-Light',
        fontSize=10,
        leading=16,
        textColor=dark_color,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        fontName='STSong-Light',
        fontSize=10,
        leading=15,
        textColor=dark_color,
        leftIndent=15,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        fontName='STSong-Light',
        fontSize=10,
        leading=15,
        textColor=colors.HexColor('#1E40AF'),
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        fontName='STSong-Light',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#374151')
    )

    story = []

    # ==================== 1. 封面 ====================
    story.append(Spacer(1, 3 * cm))
    story.append(Paragraph("SensorMind 物联网设备选型助手", title_style))
    story.append(Paragraph("—— AI 驱动的智能化 IoT 硬件方案设计与选型平台应用方案", subtitle_style))
    story.append(Spacer(1, 1.5 * cm))

    # 封面元信息表格
    meta_data = [
        [Paragraph("<b>开发平台：</b>", body_no_indent), Paragraph("秒哒 (DuMate) AI 智能化全栈开发平台", body_no_indent)],
        [Paragraph("<b>作品名称：</b>", body_no_indent), Paragraph("SensorMind 物联网设备选型助手 Web 应用", body_no_indent)],
        [Paragraph("<b>应用类型：</b>", body_no_indent), Paragraph("AI 智能决策辅助 Tool / Web 平台", body_no_indent)],
        [Paragraph("<b>提交日期：</b>", body_no_indent), Paragraph("2026 年 8 月", body_no_indent)],
        [Paragraph("<b>演示地址：</b>", body_no_indent), Paragraph("https://app-d97tc5wfrqwx.appmiaoda.com", body_no_indent)]
    ]
    t_meta = Table(meta_data, colWidths=[3.5 * cm, 11.5 * cm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), accent_blue),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#BFDBFE')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(PageBreak())

    # ==================== 2. 目录概览 ====================
    story.append(Paragraph("目录概览 (Table of Contents)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=15))

    toc_items = [
        ("一、 项目概述与目标用户群体", "1.1 项目背景 | 1.2 目标用户画像 | 1.3 核心解决问题"),
        ("二、 物联网选型痛点与功能需求", "2.1 传统硬件选型四大痛点 | 2.2 系统核心功能需求规格"),
        ("三、 开发平台（秒哒 / DuMate）应用说明", "3.1 平台能力赋能 | 3.2 敏捷极速构建与云端工程落地"),
        ("四、 系统架构与技术实现方案", "4.1 三层技术架构 | 4.2 前后端栈选型 | 4.3 数据库模型与 RLS"),
        ("五、 作品核心功能说明", "5.1 智能多模式接入 | 5.2 交互式选型问答 | 5.3 BOM 清单与拓扑代码生成"),
        ("六、 AI 功能的核心作用", "6.1 5步精细选型推理框架 | 6.2 异常需求语义纠错 | 6.3 电气兼容性自动化诊断"),
        ("七、 完整使用说明与交互指南", "7.1 新手多步指引 | 7.2 选型主流程 | 7.3 方案管理与对比 | 7.4 社交分享"),
        ("八、 应用前景与商业模式", "8.1 市场应用前景 | 8.2 商业化变现模式 | 8.3 发展规划"),
    ]
    for title, desc in toc_items:
        story.append(Paragraph(f"<b>{title}</b>", h2_style))
        story.append(Paragraph(desc, bullet_style))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # ==================== 一、 项目概述与目标用户群体 ====================
    story.append(Paragraph("一、 项目概述与目标用户群体", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=10))

    story.append(Paragraph("<b>1.1 项目背景</b>", h2_style))
    story.append(Paragraph(
        "随着物联网（IoT）技术的快速普及，智能家居、智慧农业、工业监控、环境检测等领域的硬件开发需求爆发式增长。"
        "然而，物联网开发的第一步——<b>器件选型与方案设计</b>——依然高度依赖开发者的经验积累。面对市场上种类繁多的主控芯片"
        "（如 ESP32、Arduino、STM32、Raspberry Pi）、各式各样的传感器（温湿度、气体、光照、土壤湿度等）以及复杂的电气接口"
        "（I2C、SPI、UART、ADC、GPIO），开发者往往面临选型周期长、接口不匹配、辅材遗漏以及预算不透明等问题。",
        body_style
    ))
    story.append(Paragraph(
        "<b>SensorMind</b> 正是在此背景下应运而生的一款 AI 驱动型物联网设备选型助手。用户只需选择典型应用场景或用自然语言描述项目需求，"
        "SensorMind 的 AI 智能推理大脑即可自动完成器件合理性匹配，生成包含主控、传感器、电源与辅材的精细化 BOM 成本清单、直观的 ASCII 接线拓扑图以及配套的底层初始化代码框架。",
        body_style
    ))

    story.append(Paragraph("<b>1.2 目标用户群体画像</b>", h2_style))
    user_groups = [
        ("高校工科/物联网/自动化专业师生：", "用于课程设计、毕业设计、电子设计竞赛及实验选型，快速验证硬件可行性。"),
        ("个人创客与极客开发者：", "DIY 智能硬件、极速原型验证，避开复杂的接口兼容性坑，降低选型门槛。"),
        ("中小型企业 IoT 项目工程师：", "快速评估新项目硬件成本与工期，一键生成选型报告向团队或客户汇报。"),
        ("硬件采购与集成服务商：", "快速生成完整的元器件采购清单与参考价格，提高标准化选型与采购效率。")
    ]
    for title, detail in user_groups:
        story.append(Paragraph(f"• <b>{title}</b>{detail}", bullet_style))

    # ==================== 二、 物联网选型痛点与功能需求 ====================
    story.append(Spacer(1, 10))
    story.append(Paragraph("二、 物联网选型痛点与功能需求", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=10))

    story.append(Paragraph("<b>2.1 传统硬件选型四大痛点</b>", h2_style))
    pain_points = [
        [Paragraph("<b>选型痛点</b>", body_no_indent), Paragraph("<b>传统选型方式</b>", body_no_indent), Paragraph("<b>SensorMind 解决方案</b>", body_no_indent)],
        [Paragraph("器件型号繁杂", body_no_indent), Paragraph("翻阅数百页数据手册，手动对比引脚与协议", body_no_indent), Paragraph("AI 大模型秒级精准匹配最优器件组合", body_no_indent)],
        [Paragraph("接口隐蔽冲突", body_no_indent), Paragraph("上电烧板或通信失败才发现 5V/3.3V 不匹配或 I2C 地址重叠", body_no_indent), Paragraph("选型阶段自动化电气兼容性与电平转换校验", body_no_indent)],
        [Paragraph("辅材预算漏算", body_no_indent), Paragraph("仅计算主传感器，遗漏电源适配器、面包板、杜邦线导致反复采购", body_no_indent), Paragraph("提供一站式全 BOM 清单（包含主控、电源、辅材与参考价格）", body_no_indent)],
        [Paragraph("选型周期冗长", body_no_indent), Paragraph("人工搜集与推演耗时 2-5 天", body_no_indent), Paragraph("自然语言 30 秒对话交互即可产出完整可落地方案", body_no_indent)]
    ]
    t_pain = Table(pain_points, colWidths=[3.2 * cm, 6.3 * cm, 6.5 * cm])
    t_pain.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_bg]),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_pain)

    story.append(PageBreak())

    # ==================== 三、 开发平台（秒哒 / DuMate）应用说明 ====================
    story.append(Paragraph("三、 开发平台（秒哒 / DuMate）应用说明", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=10))

    story.append(Paragraph(
        "<b>SensorMind</b> 应用全栈基于<b>秒哒 (DuMate) AI 智能化全栈开发平台</b>完成设计、开发与上线部署。"
        "秒哒平台突破了传统低代码/无代码工具的局限，提供了从全栈代码生成、Supabase 后端无缝集成、静态与 Edge Function 一键上线部署的完整闭环。",
        body_style
    ))

    story.append(Paragraph("<b>3.1 秒哒 (DuMate) 平台核心赋能</b>", h2_style))
    duma_features = [
        ("自然语言驱动极速构建：", "无需手动编写繁琐的 HTML/CSS 脚手架，通过自然语言对话即可高保真生成 React + Tailwind CSS 现代前端界面。"),
        ("开箱即用的云端后端能力：", "秒哒原生整合 Supabase 开源后端，自动完成数据库 Schema 迁移、Row Level Security (RLS) 安全策略配置以及 Edge Function 部署。"),
        ("全站视觉统一与组件标准化：", "依托秒哒内建的 UI 视觉设计引擎，全站严格遵循极淡渐变背景、12px 微圆角卡片、蓝色渐变主按钮等高品质设计规范。"),
        ("多端响应式与平滑交互：", "内置 Framer Motion 动效框架与移动端自适应布局逻辑，保证在 PC 桌面端与移动端手机设备上均具备卓越体验。")
    ]
    for title, detail in duma_features:
        story.append(Paragraph(f"• <b>{title}</b>{detail}", bullet_style))

    # ==================== 四、 系统架构与技术实现方案 ====================
    story.append(Spacer(1, 10))
    story.append(Paragraph("四、 系统架构与技术实现方案", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=10))

    story.append(Paragraph("<b>4.1 三层技术架构图</b>", h2_style))

    arch_table = [
        [Paragraph("<b>架构层级</b>", body_no_indent), Paragraph("<b>核心技术栈 / 组件</b>", body_no_indent), Paragraph("<b>主要职责</b>", body_no_indent)],
        [Paragraph("<b>前端表现层 (Client)</b>", body_no_indent), Paragraph("React 18, Vite, TypeScript,<br/>Tailwind CSS, Framer Motion, Lucide Icons", body_no_indent), Paragraph("现代空气感 UI、响应式卡片、多步骤指引动画、交互式对话、BOM 表格展现与对比卡片", body_no_indent)],
        [Paragraph("<b>AI 决策逻辑层 (Engine)</b>", body_no_indent), Paragraph("Prompt Engineering, 5步推理框架,<br/>语义纠错正则匹配器, 拓扑规则校验器", body_no_indent), Paragraph("场景意图理解、自然语言解析、多轮引导对话、元器件匹配推理、代码与接线拓扑合成", body_no_indent)],
        [Paragraph("<b>后端与数据层 (Backend)</b>", body_no_indent), Paragraph("Supabase Postgres, Edge Functions,<br/>RLS 策略, Supabase Auth", body_no_indent), Paragraph("方案持久化存储、全局案例广场同步、第三方分析日志、安全接入控制", body_no_indent)]
    ]
    t_arch = Table(arch_table, colWidths=[3.5 * cm, 6.0 * cm, 6.5 * cm])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_bg]),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_arch)

    story.append(PageBreak())

    # ==================== 五、 作品核心功能与 AI 核心作用 ====================
    story.append(Paragraph("五、 作品核心功能说明", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=10))

    features = [
        ("1. 智能多模式场景接入：", "内置“宿舍智能”、“智慧农业”、“实验室监控”、“工业检测”、“仓储物流” 5 大经典场景模板，同时支持 56px 胶囊形自由文本输入。"),
        ("2. 5步精细化选型推理对话：", "AI 引导问答，针对通信距离、供电方式、数据采集频率等细化需求进行二次确认，产出最适配硬件。"),
        ("3. 自动化 BOM 预算精算表：", "自动列出主控、传感器、执行器、电源适配器与线材辅材，明细包含名称、规格型号、数量、单价、用途说明与预估总成本。"),
        ("4. ASCII 接线拓扑与电气风险提示：", "生成结构清晰的直观接线图，并自动标注 3.3V/5V 电平转换警告、GPIO 驱动电流限制与 I2C 地址冲突防范。"),
        ("5. 硬件底层代码框架生成：", "根据选中主控（如 ESP32/Arduino）直接给出头文件引入、驱动库依赖、GPIO 引脚定义及初始化 Setup 代码。"),
        ("6. 方案云端持久化与多方案在线对比：", "支持保存至“我的方案”，支持勾选多方案进行各项参数与 AI 综合优势对比。"),
        ("7. 一键生成社交分享卡片：", "提取方案精华生成轻量化微信/QQ分享文本与卡片，便于交流与采购协同。")
    ]
    for title, detail in features:
        story.append(Paragraph(f"• <b>{title}</b>{detail}", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("六、 AI 功能在作品中的核心作用（重点突出）", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=10))

    story.append(Paragraph(
        "在传统物联网开发工具中，AI 常常仅被当作“聊天机器人”。<b>在 SensorMind 中，AI 是贯穿整个选型决策流的领域专家大脑</b>，其核心作用体现为以下三大维度：",
        body_style
    ))

    # 突出 AI 核心作用卡片
    ai_box_data = [
        [Paragraph("<b>1. 五步精细选型推理框架 (5-Step Reasoning Framework)</b>", body_no_indent)],
        [Paragraph(
            "AI 内部内置五步推理链：<b>需求意图解析 → 主控平台匹配 → 传感器/执行器遴选 → 电源与辅材推算 → 电气拓扑校验</b>。"
            "AI 不仅推荐核心器件，还能精确推算杜邦线数量、面包板规格及电源适配器功率，彻底解决硬件采购“漏买辅材”的硬伤。",
            callout_style
        )],
        [Paragraph("<b>2. 异常需求智能语义纠错与引导 (Guided Recovery Mode)</b>", body_no_indent)],
        [Paragraph(
            "当用户输入“你好”、“想买个手机”或过于模糊的非物联网文本时，AI 系统触发智能校验规则，自动切入<b>蓝色引导恢复模式</b>，"
            "友善提醒用户正确的输入范例（如“宿舍温湿度监测，预算200元”），确保选型流程始终处于专业合规轨道。",
            callout_style
        )],
        [Paragraph("<b>3. 动态电气拓扑诊断与代码自动生成 (Electrical Diagnostics)</b>", body_no_indent)],
        [Paragraph(
            "AI 根据挑选出的硬件组合，自动分析接口协议（如 DHT11 单总线、OLED I2C）并推理出具体 GPIO 接线映射，"
            "同时预警“电平不兼容（如 5V 传感器接到 3.3V ESP32）”，显著提升初学者的硬件开发成功率。",
            callout_style
        )]
    ]
    t_ai = Table(ai_box_data, colWidths=[16.0 * cm])
    t_ai.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), accent_blue),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#93C5FD')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_ai)

    story.append(PageBreak())

    # ==================== 七、 完整使用说明与交互指南 ====================
    story.append(Paragraph("七、 完整使用说明与交互指南", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=10))

    story.append(Paragraph("<b>7.1 新手多步骤分阶段指引 (Tour Guide)</b>", h2_style))
    story.append(Paragraph(
        "首次进入应用时，系统会自动启动 <b>3 步高亮脉冲引导动画</b>："
        "<br/>1) 高亮自由输入框：引导输入个性化项目需求；"
        "<br/>2) 高亮场景卡片区：提示可从经典模板快速切入；"
        "<br/>3) 高亮案例广场：指导查看已发布的经典方案积累灵感。"
        "<br/>气泡具备视口安全自适应算法，在移动端与 PC 端均能完美呈现。",
        body_style
    ))

    story.append(Paragraph("<b>7.2 用户标准选型操作流程</b>", h2_style))

    flow_data = [
        [Paragraph("<b>步骤</b>", body_no_indent), Paragraph("<b>用户操作</b>", body_no_indent), Paragraph("<b>系统响应 / AI 输出</b>", body_no_indent)],
        [Paragraph("Step 1", body_no_indent), Paragraph("输入需求或点击场景卡片", body_no_indent), Paragraph("AI 解析需求，发起 1-2 个针对性问答确认细节", body_no_indent)],
        [Paragraph("Step 2", body_no_indent), Paragraph("回答补全问题（或直接查看）", body_no_indent), Paragraph("AI 执行五步选型，生成完整方案", body_no_indent)],
        [Paragraph("Step 3", body_no_indent), Paragraph("查看选型方案详情", body_no_indent), Paragraph("展现总预算卡片、BOM 清单表、ASCII 拓扑图、代码框架", body_no_indent)],
        [Paragraph("Step 4", body_no_indent), Paragraph("保存 / 对比 / 分享", body_no_indent), Paragraph("点击保存写入 Supabase，或导出分享卡片至微信/QQ", body_no_indent)]
    ]
    t_flow = Table(flow_data, colWidths=[2.5 * cm, 6.5 * cm, 7.0 * cm])
    t_flow.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_bg]),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_flow)

    # ==================== 八、 应用前景与商业模式 ====================
    story.append(Spacer(1, 10))
    story.append(Paragraph("八、 应用前景与商业模式", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=10))

    story.append(Paragraph("<b>8.1 市场应用前景</b>", h2_style))
    story.append(Paragraph(
        "据行业统计，全球物联网设备连接数已超 150 亿，全球硬件创客与 IoT 工程师规模超千万。"
        "然而硬件选型智能化领域尚处于空白阶段。SensorMind 填补了从<b>“想法描述”到“精确 BOM 采购与接线代码”</b>之间的巨大断层，"
        "具备广阔的高校教学、创客社区及企业选型赋能前景。",
        body_style
    ))

    story.append(Paragraph("<b>8.2 商业模式 (Business Model) 规划</b>", h2_style))
    biz_models = [
        ("一键导购佣金分成 (Affiliate E-commerce)：", "与淘宝、立创商城、1688 等元器件电商平台打通，用户在 BOM 清单中一键加购下单，平台按比例收取导购佣金。"),
        ("企业级高级功能订阅 (Freemium SaaS)：", "基础选型免费；面向企业接入硬件高级原理图校验、KiCad 原理图自动导出、云端私有元器件库同步等高级功能收取 SaaS 订阅费。"),
        ("高校与创客机构定制版 (Enterprise / Edu)：", "为高校实验室、电子竞赛组委会提供定制化硬件选型教学套件与云端评测系统。")
    ]
    for title, detail in biz_models:
        story.append(Paragraph(f"• <b>{title}</b>{detail}", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("九、 总结与展望", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=10))
    story.append(Paragraph(
        "SensorMind 基于<b>秒哒 (DuMate) 开发平台</b>构建，成功将大语言模型的理解推理能力与物联网硬件选型的专业工程规范深度融合。"
        "未来，SensorMind 将继续演进，接入 EDA 原理图自动生成、实时元件库存比价以及在线电路仿真校验功能，"
        "致力于成为全球物联网开发者首选的 AI 选型与设计基础设施。",
        body_style
    ))

    # 构建 PDF
    doc.build(story, canvasmaker=PageNumCanvas)
    print(f"PDF successfully generated: {filename}")

if __name__ == '__main__':
    out_pdf = "/workspace/app-d97tc5wfrqwx/SensorMind_Application_Plan.pdf"
    build_pdf(out_pdf)
