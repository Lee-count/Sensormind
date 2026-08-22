import type { ReactNode, ComponentType } from 'react';

export interface Option {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
  withCount?: boolean;
}

export interface Scene {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
}

export interface DeviceItem {
  name: string;
  model: string;
  quantity: number;
  unitPrice: number;
  purpose: string;
}

export interface CodeSuggestion {
  framework: 'arduino' | 'micropython';
  libraries: string[];
  pinDefinitions: string[];
  initCode: string;
}

export interface PlanPayload {
  planName: string;
  sceneName: string;
  budget: string;
  precisionRequirement: string;
  communication: string;
  powerSupply: string;
  devices: DeviceItem[];
  topology: string;
  totalCost: number;
  riskTips: string;
  codeSuggestion: CodeSuggestion;
  rawText?: string;
}

export interface Plan extends PlanPayload {
  id: string;
  createdAt: string;
}

export type ChatMode = 'guided' | 'free' | 'edit';

// 约束博弈分析：冲突检测结构化输出
export interface ConflictRow {
  constraint: string;  // 约束项，例如"供电方式"
  userReq: string;     // 用户要求，例如"电池"
  feasible: string;    // 可行方案，例如"18650x3"
  cost: string;        // 代价，例如"体积大"
}

export interface ConflictPath {
  label: string;   // 路径字母，例如"A"
  desc: string;    // 描述，包含具体数字，例如"通信降配为蓝牙BLE（功耗降至10mA，续航可达300小时）"
}

export interface ConflictAnalysis {
  summary: string;          // 冲突警告文字，例如"WiFi峰值150mA x 24h = 3600mAh，超出单节18650容量，无法满足续航目标。"
  rows: ConflictRow[];      // 3个核心冲突项
  conclusion: string;       // 冲突结论，带具体数字
  paths: ConflictPath[];    // 2-3条优化路径，各含具体数字
}

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}
