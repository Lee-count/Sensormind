import type { PlanPayload, ConflictAnalysis } from '@/types';
import { supabase } from '@/db/supabase';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const HARDWARE_KB = `========== SensorMind 硬件知识库（2026年7月参考价）==========
AI 选型规则：必须优先从本库选型，禁止虚构型号和价格。

一、主控开发板
[无联网] Arduino Uno R3 ¥20 5V 16MHz 20GPIO 6路ADC | Arduino Nano ¥20 5V 22GPIO 8路ADC | Arduino Pro Mini ¥12 5V 14GPIO 无USB
[WiFi/蓝牙] ESP8266 NodeMCU ¥15 3.3V 80MHz WiFi GPIO少 | ESP32-DevKitC ¥30 3.3V 240MHz WiFi+蓝牙 34GPIO 通用首选 | ESP32-C3-DevKit ¥22 3.3V 160MHz WiFi+蓝牙5 RISC-V低功耗 | ESP32-S3-DevKit ¥55 3.3V 240MHz WiFi+蓝牙5+AI加速 | ESP32-C6-DevKit ¥35 3.3V 160MHz WiFi6+蓝牙5+Zigbee
[工业] STM32F103C8T6 ¥15 3.3V 72MHz 37GPIO 10路ADC 无联网 | STM32F407VET6 ¥40 3.3V 168MHz 82GPIO 16路ADC
[Python] 树莓派Pico ¥35 3.3V 133MHz 26GPIO MicroPython | Pico W ¥45 带WiFi

二、传感器
温湿度：DHT11 ¥8 ±2℃ 单总线 入门 | DHT22 ¥25 ±0.5℃ 单总线 性价比首选 | SHT30 ¥35 ±0.3℃ I2C地址0x44 高精度 | SHT40 ¥45 ±0.2℃ I2C地址0x44 科研级 | DS18B20 ¥10 ±0.5℃ 单总线 仅温度 防水版可用
气体：MQ-2 ¥10 烟雾/液化气 模拟 需预热 | MQ-135 ¥12 空气质量/CO2/氨气 模拟 需预热 | MQ-7 ¥15 一氧化碳 模拟 | CCS811 ¥25 eCO2/TVOC I2C地址0x5A 需校准 | SGP30 ¥35 TVOC/eCO2 I2C地址0x58 比CCS811稳定
光照：光敏电阻 ¥1 模拟 仅明暗 | BH1750 ¥12 数字 I2C地址0x23 首选 | GY-302 ¥15 BH1750成品带排针
人体/运动：HC-SR501 ¥8 PIR红外 3-5米 数字 | LD2410C ¥25 毫米波雷达 串口 可测静止人体 | HC-SR04 ¥8 超声波 2-400cm | MPU6050 ¥15 六轴 I2C地址0x68
土壤：电阻式土壤湿度 ¥5 模拟 易腐蚀 | 电容式土壤湿度 ¥12 模拟 耐腐蚀 推荐 | 土壤EC传感器 ¥35 I2C 湿度+盐分 | 土壤pH传感器 ¥45 模拟 ±0.1pH
其他：BMP280 ¥12 气压+温度 I2C地址0x76 | 水位传感器 ¥8 模拟 0-4cm | 称重传感器HX711 ¥15 配模块¥8 | 声音传感器 ¥5 模拟 | 火焰传感器 ¥5 模拟 760-1100nm

三、通信模块
无线：ESP自带WiFi ¥0 50米 功耗80-150mA | ESP自带BLE ¥0 10米 功耗10mA | HC-05 ¥15 蓝牙2.0 串口 | Zigbee CC2530 ¥20 100米 UART mesh | LoRa SX1276 ¥25 3km SPI | LoRa SX1262 ¥35 5km SPI
有线：MAX485 ¥8 RS485 1200米 | MCP2515 ¥12 CAN 10km | CH340G ¥5 USB转串口 | ENC28J60 ¥15 以太网 SPI
蜂窝：SIM800C ¥35 GSM/GPRS 2G | Air780E ¥45 4G Cat.1 阿里云MQTT | BC26 ¥40 NB-IoT 超低功耗

四、显示与交互
OLED 0.96寸 ¥18 I2C地址0x3C SSD1306 128x64 | OLED 1.3寸 ¥25 I2C地址0x3C SH1106 | LCD1602 ¥15 I2C 字符 | LCD2004 ¥20 I2C 4行 | TM1637 ¥8 I2C 4位数码管 | WS2812B灯带 ¥15/米 单总线 RGB

五、执行器与控制
继电器1路 ¥8 数字GPIO 光耦隔离 | 继电器4路 ¥12 数字GPIO | L298N ¥15 PWM 双路电机2A | MG996R舵机 ¥20 PWM 大扭矩 | SG90舵机 ¥8 PWM 小舵机 | MOSFET模块 ¥5 PWM 调速调光 | 有源蜂鸣器 ¥2 数字 | 无源蜂鸣器 ¥2 PWM

六、电源与配件
电源：5V2A适配器 ¥15 | 5V3A适配器 ¥20 | 18650电池 ¥12/节 3000mAh | TP4056充电模块 ¥8 | 太阳能板5V2W ¥15 | 太阳能板12V10W ¥45 配MPPT¥25 | AMS1117-3.3 ¥3 LDO | DC-DC降压 ¥8
配件：面包板830孔 ¥8 | 杜邦线40根 ¥5 | USB数据线 ¥5 | 电阻包400个 ¥8 | 电容包200个 ¥8 | 按键模块 ¥1 | LED灯包100个 ¥5

七、接口约束（必须遵守）
1. 电平：Arduino为5V电平，ESP32/ESP8266/STM32/Pico为3.3V电平。3.3V主控接5V传感器需电平转换，接5V继电器可能驱动不足。
2. ADC限制：Uno 6路(A0-A5)，Nano 8路，ESP32 18路，STM32F103 10路。模拟传感器数量不能超过ADC路数。
3. I2C地址：BH1750(0x23/0x5C)，OLED SSD1306(0x3C/0x3D)，SHT30/SHT40(0x44/0x45)，CCS811(0x5A)，SGP30(0x58)，BMP280(0x76/0x77)，MPU6050(0x68/0x69)。地址冲突时必须更换或改总线。
4. 单总线：DHT11/DHT22/DS18B20每路GPIO只能接一个，读取间隔大于2秒。
5. 功耗：ESP32峰值500mA，ESP8266峰值400mA。18650电池3000mAh供ESP32-WiFi连续约6-8小时，蓝牙BLE约300小时，LoRa休眠+定时发送可数月。
6. WiFi与电池矛盾：电池供电禁用WiFi连续传输，替代为蓝牙BLE/LoRa/或WiFi每小时唤醒1次。
7. ESP32串口：GPIO1(TX)/GPIO3(RX)用于下载调试，外接串口设备建议换GPIO。

八、场景映射规则
宿舍智能：<100元用Arduino Nano+DHT11+光敏+蜂鸣器 | 100-300元用ESP32-DevKitC+DHT22+MQ-135+OLED | >300元用ESP32-S3+SHT40+SGP30+OLED+继电器
智慧农业：基础监测用ESP32-C3+电容土壤湿度+BH1750+DHT22 | 自动灌溉加继电器+水泵(独立12V) | 大棚综合加土壤EC+LoRa+太阳能
实验室监测：环境记录用ESP32+SHT30+CCS811+OLED+WiFi | 气体安全用Arduino+MQ-7/MQ-135+蜂鸣器+继电器通风 | 精密设备用STM32F407+多路ADC+RS485+以太网
工业巡检：振动用STM32F103+MPU6050+RS485/LoRa | 温度巡检用ESP32+DS18B20多探头+WiFi | 设备状态用STM32F407+CAN+4G
智能仓储：环境监测用ESP32+DHT22+MQ-2+蜂鸣器 | 货物追踪用RFID-RC522(¥15)+ESP32+OLED | 货架安全用HX711+ESP32+WiFi | 安防消防用烟雾+火焰+PIR+声光报警+4G

九、选型优先级算法
有联网：预算<20选ESP8266 | 20-50选ESP32-DevKitC | >50且需AI选ESP32-S3 | 电池供电选ESP32-C3
无联网：预算<20选Arduino Nano | 20-40选Arduino Uno | 工业稳定选STM32F103
精度：入门级用DHT11/MQ/光敏电阻 | 标准级用DHT22/BH1750/MPU6050 | 高精度用SHT30/SHT40/SGP30
通信：室内有插座用WiFi | 手机直连用蓝牙BLE | 户外远距离用LoRa | 工业组网用RS485/CAN | 全国覆盖用4G Cat.1或NB-IoT
供电：室内固定用5V2A适配器 | 电池便携用18650+TP4056 | 户外长期用太阳能+蓄电池+MPPT

十、自检清单（生成后必须核对）
1. 型号是否来自本库？禁止编造如ESP32-Pro-Max
2. 价格是否在本库范围内？禁止DHT22卖¥5
3. 总价是否等于分项之和？
4. 拓扑图引脚是否与代码一致？
5. 模拟传感器数量是否超过ADC路数？
6. I2C地址是否冲突？
7. 电池+WiFi连续是否触发冲突？
8. 3.3V主控接5V继电器是否提示电平不足？
9. 户外部署是否提示防水外壳？
10. 代码include和引脚定义是否与硬件匹配？
================================================================`;

const SYSTEM_PROMPT = `你是 SensorMind 智能设备选型助手，专门为物联网/电子/自动化专业学生、DIY 爱好者和小型项目开发者提供硬件选型建议。

${HARDWARE_KB}

请根据用户提供的场景和约束条件，生成一份个性化的 IoT 设备选型方案。必须从上方知识库中选型，禁止编造不在库中的型号或价格。

输出必须严格为 JSON 格式。JSON 中所有字符串都只能包含纯文本，禁止包含以下任何内容：
- markdown 语法，包括反引号、井号、星号、加号、减号、大于号、波浪号、中括号列表等
- emoji、彩色符号或任何特殊 Unicode 符号
- HTML 标签
- 代码块标记或真正的代码

JSON 结构如下：
{
  "devices": [
    {
      "name": "设备名称，纯文本",
      "model": "推荐型号，纯文本",
      "quantity": 数量（整数）,
      "unitPrice": 参考单价（人民币，数字，必须与知识库价格一致）,
      "purpose": "用途说明，纯文本"
    }
  ],
  "topology": "用纯 ASCII 字符绘制的接线拓扑图。按以下规则绘制：1) 主控板放在顶部中央；2) 传感器和模块挂在主控下方，用竖线连接；3) 标注每个设备使用的 GPIO 接口和通信协议；4) 电源单独从左侧或右侧标注；5) 如果多个设备共用 I2C 总线，标注各自地址；6) 如有冲突（地址重复或接口不足），在图旁加 [警告：...] 提示。只允许使用 + - | [ ] ( ) 这些字符和字母、数字、汉字，禁止使用 emoji、反引号、井号、星号、尖括号或其他特殊符号。",
  "totalCost": 总预算（数字，为 devices 中 quantity * unitPrice 之和），
  "riskTips": "风险提示，纯文本，说明方案中需要注意的问题或常见坑点。",
  "codeSuggestion": {
    "framework": "arduino" 或 "micropython",
    "libraries": ["库名称1", "库名称2"],
    "pinDefinitions": ["引脚定义说明1，例如 DHT22_DATA 接 GPIO4", "引脚定义说明2"],
    "initCode": "纯文本描述的初始化代码框架。不要使用反引号或代码块。请用分号或换行分隔步骤，例如：include DHT.h；创建 dht 对象，引脚4，类型DHT22；setup中启动串口9600，dht.begin()；loop中读取温湿度，打印到串口。"
  }
}

注意：
1. 推荐型号必须来自上方知识库，禁止编造。
2. 单价必须与知识库价格一致，误差不超过±5元。
3. 总预算要与用户选择的预算范围尽量匹配。
4. 拓扑图只使用允许的 ASCII 字符。
5. 代码建议要包含关键库、引脚定义和初始化代码框架，但全部用纯文本描述，不要写真正的代码。
6. 只输出 JSON，不要添加 markdown 代码块或其他说明文字。`;

// ── 通用硬件推理引擎 System Prompt（精准选型版）──
const FREE_ENGINE_SYSTEM_PROMPT = `你是 SensorMind 通用硬件推理引擎，专为物联网/电子/机器人项目提供硬件选型方案。

${HARDWARE_KB}

========================
第一步：判定项目主类型（优先级从高到低，只选1个主类型）
========================

从用户输入提取核心动词/名词，判断主类型：
1. 移动类：含"跑/走/飞/小车/机器人/履带/移动/行驶/轮子" → 主类型=移动
2. 视觉类：含"摄像头/识别/图像/看路/人脸/视觉/拍/监控" → 主类型=视觉
3. 执行类：含"控制/开关/联动/报警/灯/风扇/喷水/灌溉/开门/关门/升降/抓取" → 主类型=执行
4. 采集类：含"监测/检测/看数据/读数/记录/测量/采集" → 主类型=采集

同时含多类型时按以上优先级选主类型，其余为副类型。

========================
第二步：按主类型锁定硬件范围（范围外禁止推荐）
========================

【主类型=移动】
必有：主控、电机（TT减速电机）、电机驱动（L298N/TB6612FNG）、底盘（亚克力底盘）、轮子（橡胶车轮）、电池（18650+电池盒）
用户明确提到才加：循迹传感器(提到循迹/巡线)、HC-SR04避障(提到避障)、蓝牙/WiFi遥控(提到手机控制/遥控)
禁止推荐：温湿度传感器、气体传感器、光照传感器、土壤传感器、气压传感器、人体传感器、蜂鸣器、LED灯带、继电器（除非用户明确提到环境监测或报警）

【主类型=采集】
必有：主控、传感器（仅限用户提到的监测对象，见第三步）、电源
用户明确提到才加：显示屏(提到显示/屏幕/看数据)、通信模块(提到上传/远程/手机查看)、继电器(提到联动控制/自动执行)
禁止推荐：电机、电机驱动、底盘、轮子、舵机、机械臂（除非用户提到机械动作）

【主类型=执行】
必有：主控、执行器（继电器/舵机/MOSFET/电机，根据动作选1-2种）、触发传感器（根据触发条件选）、电源
用户明确提到才加：通信模块(提到远程控制)、显示屏(提到显示状态)
禁止推荐：底盘、轮子、超声波避障、与控制动作无关的传感器

【主类型=视觉】
必有：带摄像头主控（ESP32-Cam或ESP32-S3）、电源
用户明确提到才加：云台舵机(提到转动/扫描/追踪)、LED补光(提到夜间/暗光)、通信模块(提到上传/远程查看)
禁止推荐：电机驱动、底盘、轮子（除非明确说移动机器人）、与视觉无关的传感器

超出范围兜底：
- 完全超出物联网（如帮我写论文）→ devices填空数组，在riskTips说明"我是SensorMind，专注物联网硬件选型，请描述你的硬件项目"
- 涉及物联网但知识库覆盖不全（如无人机飞控）→ 给基础传感器+通信部分，在riskTips注明飞控部分超出范围

========================
第三步：传感器精准匹配（严格按用户提到的监测对象选型）
========================

用户提到 → 对应型号（根据预算选1个，禁止同时推荐多个测同一物理量的传感器）：
温湿度/温度/湿度 → 预算<100选DHT11¥8，100-300选DHT22¥25，>300选SHT30¥35
空气/气体/CO2/甲醛/TVOC → 预算<100选MQ-135¥12，>100选CCS811¥25或SGP30¥35
光照/亮度/阳光 → 预算<50选光敏电阻¥1，>=50选BH1750¥12
土壤/土壤湿度 → 电容式土壤湿度¥12（优先）或电阻式¥5
人体/防盗/有没有人 → HC-SR501¥8（近距）或LD2410C¥25（需测静止人体）
姿态/角度/平衡/倾斜 → MPU6050¥15
气压/海拔 → BMP280¥12
水位/液位 → 水位传感器¥8
火焰/火灾 → 火焰传感器¥5
未提到的监测对象 → 禁止加任何对应传感器

========================
第四步：预算硬约束
========================

生成方案时按以下顺序控制总价：
1. 先按主类型选必有硬件
2. 用户明确提到的功能才加对应硬件
3. 如总价超预算，依次砍减：
   a. 用户未明确提到的可选配件（显示屏、蜂鸣器、LED）
   b. 降精度（SHT30→DHT22→DHT11，BH1750→光敏电阻）
   c. 降主控（ESP32-S3→ESP32-DevKitC→ESP8266→Arduino Nano）
   d. 仍超预算→在riskTips说明"当前预算不足，建议增加至XXX元，或减少功能：XXX"
4. 每个方案只推荐1种供电方式（室内固定→适配器，移动/便携→电池，户外长期→太阳能）
5. 配件（面包板/杜邦线/USB线）总共最多各1个

========================
第五步：自检清单（输出前强制逐条执行）
========================

1. 每个传感器是否对应用户提到的监测对象？否则删除
2. 每个执行器是否对应用户提到的动作？否则删除
3. 总价是否超预算？超则重新砍减
4. 是否有重复功能硬件（如同时有DHT22和SHT30）？只保留1个
5. 移动类是否有电机+驱动+底盘？缺则补全
6. 采集/执行/视觉类是否误含了移动硬件（底盘/轮子/电机）？含则删除
7. I2C地址是否冲突？冲突则在riskTips提示
8. 3.3V主控接5V继电器？则在riskTips提示驱动不足

========================
输出格式（严格JSON，无markdown）
========================

{
  "sceneName": "根据用户输入提炼的项目名称，10字以内",
  "devices": [
    {
      "name": "设备名称",
      "model": "推荐型号（必须来自上方知识库，禁止编造）",
      "quantity": 数量（整数）,
      "unitPrice": 参考单价（必须与知识库一致，误差≤5元）,
      "purpose": "用途说明，纯文本"
    }
  ],
  "topology": "纯ASCII接线拓扑图，标注GPIO口和通信协议，只用 + - | [ ] ( ) 及字母数字汉字",
  "totalCost": 总价（数字，等于各项quantity*unitPrice之和，禁止与分项之和不一致）,
  "riskTips": "兼容性提示或注意事项，纯文本，至少1条",
  "codeSuggestion": {
    "framework": "arduino或micropython",
    "libraries": ["库名称"],
    "pinDefinitions": ["引脚定义，如 DHT22_DATA 接 GPIO4"],
    "initCode": "纯文本描述初始化框架，不使用反引号或代码块"
  }
}

只输出JSON，不添加任何说明文字或markdown代码块。`;

type ResponseFormat =
  | { type: 'json_object' }
  | { type: 'json_schema'; json_schema: { name: string; schema: Record<string, unknown> } };

const RESPONSE_FORMAT: ResponseFormat = { type: 'json_object' };

export async function generatePlan(
  sceneName: string,
  constraints: Record<string, string>
): Promise<PlanPayload> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: buildUserPrompt(sceneName, constraints),
    },
  ];

  const parsed = await callMiniMax(messages, RESPONSE_FORMAT);

  return normalizePlan(sceneName, constraints, parsed);
}

export interface ParseResult {
  type: 'plan' | 'clarify';
  constraints: Record<string, string>;
  missingKeys: string[];
  question: string;
  options: string[];
  message: string;
  conflict: string | null;
  conflictAnalysis: ConflictAnalysis | null;
}

const PARSE_RESPONSE_FORMAT = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'free_input_parse',
    schema: {
      type: 'object',
      properties: {
        constraints: {
          type: 'object',
          properties: {
            goals: { type: 'string' },
            deployEnv: { type: 'string' },
            sceneName: { type: 'string' },
            budget: { type: 'string' },
            precision: { type: 'string' },
            communication: { type: 'string' },
            power: { type: 'string' },
          },
          required: ['goals', 'deployEnv', 'sceneName', 'budget', 'precision', 'communication', 'power'],
        },
        missingKeys: { type: 'array', items: { type: 'string' } },
        conflict: { type: 'string' },
        conflictAnalysis: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  constraint: { type: 'string' },
                  userReq: { type: 'string' },
                  feasible: { type: 'string' },
                  cost: { type: 'string' },
                },
                required: ['constraint', 'userReq', 'feasible', 'cost'],
              },
            },
            conclusion: { type: 'string' },
            paths: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  desc: { type: 'string' },
                },
                required: ['label', 'desc'],
              },
            },
          },
          required: ['summary', 'rows', 'conclusion', 'paths'],
        },
        question: { type: 'string' },
        options: { type: 'array', items: { type: 'string' } },
        message: { type: 'string' },
      },
      required: ['constraints', 'missingKeys', 'conflict', 'conflictAnalysis', 'question', 'options', 'message'],
    },
  },
};

export async function parseFreeInput(
  input: string,
  stage: number,
  existingConstraints: Record<string, string>
): Promise<ParseResult> {
  const systemPrompt = `你是 SensorMind 智能设备选型助手。请解析用户对物联网项目的需求描述。

${HARDWARE_KB}

解析优先级：先提取功能目标，再提取技术约束。
- goals：功能目标，例如 温湿度监测、空气质量监测、设备远程控制（可多个，用顿号分隔）
- deployEnv：部署环境，例如 室内常温干燥、室内潮湿、户外有遮挡、户外无遮挡
- sceneName：场景名称，例如 宿舍智能、智慧农业、实验室监测、工业巡检
- budget：预算范围，例如 200元以内、200-500元、500-1000元、1000元以上
- precision：传感器精度要求，例如 入门级、标准级、高精度
- communication：通信方式偏好，例如 有线、蓝牙、WiFi、LoRa
- power：供电方式，例如 USB/适配器、电池、太阳能+电池

规则：
1. 优先从用户输入中提取功能目标（goals），如"温湿度监测""想做个监控"等，即使没有明确说出技术参数也要先识别功能意图。
2. 如果功能目标已确认，再追问技术约束（预算、通信、供电等）。
3. 如果所有信息都已具备，missingKeys 为空数组，type 为 plan。
4. 选择最重要的一个缺失字段追问，options 给出 3-4 个常见选项。
5. 这是第 ${stage + 1} 轮解析，最多允许 2 轮追问。
6. 输出严格 JSON 格式，禁止 markdown、emoji、特殊符号。

冲突检测规则（当检测到矛盾需求时填写 conflict 和 conflictAnalysis）：
- 典型冲突场景举例：
  * 电池供电 + WiFi + 长续航（WiFi功耗高，电池容量有限）
  * 极低预算 + 高精度传感器（高精度传感器价格超预算）
  * 电池供电 + 高频采样 + 超长续航（高频采样耗电大）
  * 户外无遮挡 + 蓝牙（蓝牙室外通信距离不足）
- 检测到冲突时：
  * conflict 填写一句话冲突警告
  * conflictAnalysis.summary 填写冲突概述
  * conflictAnalysis.rows 填写恰好3个核心冲突项，每项包含：
    - constraint：约束维度名称（如"供电方式"）
    - userReq：用户要求（如"电池供电"）
    - feasible：当前可行方案（如"18650x3并联"）
    - cost：该方案的代价（如"体积大/重量增加"），15字以内
  * conflictAnalysis.conclusion 填写具体数字推导的冲突结论，必须包含功耗数值、续航时间、容量等真实计算数字
  * conflictAnalysis.paths 填写2-3条优化路径，每条必须含具体数字（功耗mA、续航小时、成本增减元）
- 未检测到冲突时：conflict 填空字符串，conflictAnalysis 填 {"summary":"","rows":[],"conclusion":"","paths":[]}

JSON 结构：
{
  "constraints": { "goals": "", "deployEnv": "", "sceneName": "", "budget": "", "precision": "", "communication": "", "power": "" },
  "missingKeys": ["缺失的字段名"],
  "conflict": "冲突描述或空字符串",
  "conflictAnalysis": {
    "summary": "冲突概述",
    "rows": [{"constraint":"约束项","userReq":"用户要求","feasible":"可行方案","cost":"代价"}],
    "conclusion": "具体数字推导的冲突结论",
    "paths": [{"label":"A","desc":"优化路径描述（含具体数字）"}]
  },
  "question": "追问问题或空字符串",
  "options": ["选项1", "选项2", "选项3"],
  "message": "给用户的完整回复，纯文本，无特殊符号"
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `用户输入：${input}\n已提取约束：${JSON.stringify(existingConstraints)}`,
    },
  ];

  const parsed = await callMiniMax(messages, PARSE_RESPONSE_FORMAT);

  const constraints = (parsed.constraints || {}) as Record<string, string>;
  const missingKeys = Array.isArray(parsed.missingKeys) ? parsed.missingKeys as string[] : [];
  const conflict = parsed.conflict ? String(parsed.conflict) : null;

  // 解析结构化冲突分析
  let conflictAnalysis: ConflictAnalysis | null = null;
  const ca = parsed.conflictAnalysis as Record<string, unknown> | undefined;
  if (ca && (ca.summary || (Array.isArray(ca.rows) && ca.rows.length > 0))) {
    conflictAnalysis = {
      summary: String(ca.summary || ''),
      rows: Array.isArray(ca.rows)
        ? (ca.rows as Record<string, unknown>[]).map((r) => ({
            constraint: String(r.constraint || ''),
            userReq: String(r.userReq || ''),
            feasible: String(r.feasible || ''),
            cost: String(r.cost || ''),
          }))
        : [],
      conclusion: String(ca.conclusion || ''),
      paths: Array.isArray(ca.paths)
        ? (ca.paths as Record<string, unknown>[]).map((p) => ({
            label: String(p.label || ''),
            desc: String(p.desc || ''),
          }))
        : [],
    };
  }

  const result: ParseResult = {
    type: missingKeys.length === 0 && !conflict ? 'plan' : 'clarify',
    constraints,
    missingKeys,
    question: parsed.question ? String(parsed.question) : '',
    options: Array.isArray(parsed.options) ? parsed.options as string[] : [],
    message: parsed.message ? String(parsed.message) : '请补充以下信息。',
    conflict,
    conflictAnalysis,
  };

  return result;
}

async function callMiniMax(
  messages: ChatMessage[],
  format: ResponseFormat = RESPONSE_FORMAT
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke<{
    choices?: Array<{ message?: { content?: string } }>;
    base_resp?: { status_code?: number; status_msg?: string };
  }>('minimax-m3', {
    body: {
      model: 'MiniMax-M3',
      thinking: { type: 'disabled' },
      messages,
      response_format: format,
      max_completion_tokens: 4096,
      temperature: 0.7,
    },
  });

  if (error) {
    const errorMsg = await error?.context?.text?.();
    throw new Error(errorMsg || error.message || 'AI 服务调用失败');
  }

  if (data?.base_resp?.status_code && data.base_resp.status_code !== 0) {
    throw new Error(`AI 服务错误 ${data.base_resp.status_code}: ${data.base_resp.status_msg}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI 返回内容为空');
  }

  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error('AI 返回内容格式不正确');
  }
}

function buildUserPrompt(sceneName: string, constraints: Record<string, string>): string {
  return `场景：${sceneName}\n预算范围：${constraints.budget || '未指定'}\n精度要求：${constraints.precision || '未指定'}\n通信方式：${constraints.communication || '未指定'}\n供电方式：${constraints.power || '未指定'}`;
}

function normalizePlan(
  sceneName: string,
  constraints: Record<string, string>,
  parsed: Record<string, unknown>
): PlanPayload {
  const devices = Array.isArray(parsed.devices) ? parsed.devices : [];
  const totalCost = Number(parsed.totalCost) || devices.reduce(
    (sum: number, d: Record<string, unknown>) => sum + (Number(d.quantity) || 0) * (Number(d.unitPrice) || 0),
    0
  );

  return {
    planName: sceneName,
    sceneName,
    budget: constraints.budget || '',
    precisionRequirement: constraints.precision || '',
    communication: constraints.communication || '',
    powerSupply: constraints.power || '',
    devices: devices.map((d: Record<string, unknown>) => ({
      name: String(d.name || ''),
      model: String(d.model || ''),
      quantity: Number(d.quantity) || 0,
      unitPrice: Number(d.unitPrice) || 0,
      purpose: String(d.purpose || ''),
    })),
    topology: String(parsed.topology || ''),
    totalCost,
    riskTips: String(parsed.riskTips || ''),
    codeSuggestion: {
      framework: (parsed.codeSuggestion as Record<string, unknown>)?.framework === 'micropython' ? 'micropython' : 'arduino',
      libraries: Array.isArray((parsed.codeSuggestion as Record<string, unknown>)?.libraries)
        ? (parsed.codeSuggestion as Record<string, unknown>).libraries as string[]
        : [],
      pinDefinitions: Array.isArray((parsed.codeSuggestion as Record<string, unknown>)?.pinDefinitions)
        ? (parsed.codeSuggestion as Record<string, unknown>).pinDefinitions as string[]
        : [],
      initCode: String((parsed.codeSuggestion as Record<string, unknown>)?.initCode || ''),
    },
    rawText: '',
  };
}

/**
 * 判断用户输入是否为有效的物联网项目描述。
 * 无效输入（纯打招呼/情绪词/过于模糊/完全无关）返回 false，触发引导模式。
 */
export function isValidIotInput(input: string): boolean {
  const text = input.trim().toLowerCase();
  if (!text || text.length < 2) return false;

  // ── 有效关键词（先提取，后续逻辑复用）──
  const sensorKw = ['温度', '湿度', '温湿度', '空气', '气体', 'co2', '甲醛', 'tvoc', '光照', '亮度', '距离', '人体', '土壤', '水质', '水位', '烟雾', '火焰', '气压', '海拔', '声音', '振动', '重量', '姿态', '图像', '摄像', '视觉', '人脸'];
  const actuatorKw = ['电机', '马达', '小车', '机器人', '履带', '轮子', '灯', '风扇', '继电器', '舵机', '报警', '蜂鸣器', '喷水', '灌溉', '浇', '开关', '升降', '抓取', '循迹', '巡线', '避障', '遥控', '移动'];
  const contextKw = ['宿舍', '寝室', '大棚', '农业', '实验室', '工业', '工厂', '仓库', '仓储', '户外', '室内', '家里', '办公室', 'wifi', '蓝牙', '联网', '上传', '手机', '远程', '监测', '检测', '采集', '测量', '控制', '识别', '看路'];
  const budgetRe = /\d+\s*(元|块)|预算|不超过|大概|左右/;
  const allKw = [...sensorKw, ...actuatorKw, ...contextKw];
  const hasKw = allKw.some((k) => text.includes(k));
  const hasBudget = budgetRe.test(text);

  // ── 纯打招呼/情绪词：完全匹配才拦截 ──
  const greetings = [
    '你好', '您好', 'hi', 'hello', '在吗', '在不在', '早上好', '晚上好', '早安', '晚安', '嗨', 'hey',
    '牛逼', '厉害', '谢谢', '再见', 'ok', 'okay', '好的', '嗯', '哦', '啊', '拜拜',
  ];
  const isGreetingOnly = greetings.some(
    (g) => text === g || text === g + '！' || text === g + '!' || text === g + '~'
  );
  if (isGreetingOnly) return false;

  // ── 完全无关话题：包含即拦截 ──
  const irrelevant = ['天气怎么样', '推荐电影', '推荐书', '推荐歌', '怎么学', '帮我写论文', '写作文', '历史上的', '介绍一下自己'];
  if (irrelevant.some((k) => text.includes(k))) return false;

  // ── 纯模糊词：整段只有模糊词，没有实质关键词时拦截 ──
  // 先去除这些前缀词，看剩余内容是否含有效关键词
  const vaguePrefix = [
    '我想', '我想做', '我想做一个', '我想做个', '我要做', '我要做一个',
    '帮我设计', '帮我设计一个', '帮我做', '帮我做一个', '帮我来一个',
    '随便来一个', '随便来个', '来一个', '来个', '来一个方案', '来个方案',
    '做一个项目', '做个项目', '设计一个', '设计个', '搞一个', '搞个', '整一个', '整个',
    '随便', '不知道', '给我推荐', '推荐一个', '随意',
  ];
  // 如果输入在去掉所有模糊前缀后仍无有效关键词，则判无效
  let stripped = text;
  for (const p of vaguePrefix) {
    stripped = stripped.replace(new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*'), '');
  }
  // stripped 为去掉模糊前缀后的剩余内容
  const strippedHasKw = allKw.some((k) => stripped.includes(k)) || budgetRe.test(stripped);
  // 如果整段原文也不含有效关键词 → 无效
  if (!hasKw && !hasBudget) return false;
  // 如果原文含有效关键词但全部来自模糊前缀之外 → 有效（如"我想做一个小车"）
  // 如果 stripped 去掉前缀后没有关键词，且原文关键词全在前缀里（极少数情况）→ 允许通过
  // 综合：只要原文有有效关键词或预算，就通过（前缀+关键词组合如"我想做一个宿舍温湿度"是有效的）
  void strippedHasKw; // 保留变量供未来扩展，当前逻辑由 hasKw/hasBudget 主导

  return hasKw || hasBudget;
}
export async function generateFreePlan(userInput: string): Promise<PlanPayload> {
  const messages: ChatMessage[] = [
    { role: 'system', content: FREE_ENGINE_SYSTEM_PROMPT },
    { role: 'user', content: userInput },
  ];

  const parsed = await callMiniMax(messages, RESPONSE_FORMAT);

  // sceneName 由 AI 从输入中提炼，回退到截断用户输入
  const sceneName = String(parsed.sceneName || userInput.slice(0, 20));
  return normalizePlan(sceneName, {}, parsed);
}
