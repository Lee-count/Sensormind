import type { Plan, PlanPayload } from '@/types';
import { supabase } from '@/db/supabase';
import { getUserId } from '@/utils/userId';

export async function savePlan(payload: PlanPayload): Promise<Plan> {
  const { data, error } = await supabase
    .from('plans')
    .insert({
      user_id: getUserId(),
      plan_name: payload.planName || payload.sceneName,
      scene_name: payload.sceneName,
      budget: payload.budget,
      precision_requirement: payload.precisionRequirement,
      communication: payload.communication,
      power_supply: payload.powerSupply,
      devices: payload.devices,
      topology: payload.topology,
      total_cost: payload.totalCost,
      risk_tips: payload.riskTips,
      code_suggestion: payload.codeSuggestion,
      raw_text: payload.rawText,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || '保存方案失败');
  }

  return mapPlan(data);
}

export async function updatePlanName(id: string, planName: string): Promise<void> {
  if (!planName.trim()) {
    throw new Error('方案名称不能为空');
  }
  const { error } = await supabase
    .from('plans')
    .update({ plan_name: planName.trim() })
    .eq('id', id)
    .eq('user_id', getUserId());

  if (error) {
    throw new Error(error.message || '更新方案名称失败');
  }
}

export async function fetchPlans(limit = 50): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_deleted', false)
    .eq('user_id', getUserId())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || '获取历史方案失败');
  }

  return Array.isArray(data) ? data.map(mapPlan) : [];
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase
    .from('plans')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', getUserId());

  if (error) {
    throw new Error(error.message || '删除方案失败');
  }
}

export async function fetchPlanById(id: string): Promise<Plan | null> {
  // 按 ID 查询时不限制 user_id，支持分享卡片只读访问
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || '获取方案详情失败');
  }

  return data ? mapPlan(data) : null;
}

function mapPlan(row: Record<string, unknown>): Plan {
  return {
    id: String(row.id),
    planName: String(row.plan_name || row.scene_name || ''),
    sceneName: String(row.scene_name),
    budget: String(row.budget),
    precisionRequirement: String(row.precision_requirement),
    communication: String(row.communication),
    powerSupply: String(row.power_supply),
    devices: Array.isArray(row.devices) ? row.devices : [],
    topology: String(row.topology),
    totalCost: Number(row.total_cost) || 0,
    riskTips: String(row.risk_tips || ''),
    codeSuggestion: (row.code_suggestion as Plan['codeSuggestion']) || {
      framework: 'arduino',
      libraries: [],
      pinDefinitions: [],
      initCode: '',
    },
    rawText: String(row.raw_text || ''),
    createdAt: String(row.created_at),
  };
}
