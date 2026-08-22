import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/layout/Header';
import { useEffect, useRef, useState } from 'react';
import type { Plan } from '@/types';

// 对比维度定义
interface CompareRow {
  label: string;
  getValue: (plan: Plan) => string;
  // 用于表格展示的截断值（可选），full 值用于 title tooltip
  getDisplay?: (plan: Plan) => { short: string; full: string };
}

// 设备类型截断：只取核心名称，超20字截断，返回 short/full
function getDeviceDisplay(plan: Plan): { short: string; full: string } {
  const names = plan.devices.map((d) => d.name);
  const full = names.join('、') || '—';
  if (full.length <= 20) return { short: full, full };
  // 截断到20字
  const truncated = full.slice(0, 20) + '…';
  return { short: truncated, full };
}

const COMPARE_ROWS: CompareRow[] = [
  { label: '适用场景', getValue: (p) => p.sceneName },
  {
    label: '设备类型',
    getValue: (p) => p.devices.map((d) => d.name).join('、') || '—',
    getDisplay: (p) => getDeviceDisplay(p),
  },
  { label: '主控型号', getValue: (p) => p.devices.find((d) => /主控|MCU|Arduino|ESP|单片机/i.test(d.name))?.model || p.devices[0]?.model || '—' },
  { label: '总预算', getValue: (p) => p.budget },
  { label: '实际费用', getValue: (p) => `¥${p.totalCost.toFixed(2)}` },
  { label: '通信方式', getValue: (p) => p.communication },
  { label: '供电方式', getValue: (p) => p.powerSupply },
  { label: '精度要求', getValue: (p) => p.precisionRequirement },
];

// 方案字母标签
const PLAN_LABELS = ['方案A', '方案B', '方案C'];

// 清理 AI 输出：去除思考链标签及其内容、Markdown 语法、英文段落
function cleanAiOutput(raw: string): string {
  let text = raw;
  // 去除 <think>...</think> 及类似标签（含嵌套）
  text = text.replace(/<think[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<thinking[\s\S]*?<\/thinking>/gi, '');
  text = text.replace(/<[a-z_]+>[\s\S]*?<\/[a-z_]+>/gi, '');
  // 去除 markdown 加粗/斜体/列表/代码块标记
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/^[-*]\s+/gm, '');
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`(.+?)`/g, '$1');
  // 去除纯英文行（包含大量英文单词的行视为思考过程）
  text = text.split('\n').filter((line) => {
    const englishRatio = (line.match(/[a-zA-Z]/g) || []).length / Math.max(line.length, 1);
    return englishRatio < 0.5 || line.trim() === '';
  }).join('\n');
  // 压缩多余空行
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text || '暂无建议，请稍后重试。';
}

// 生成 AI 对比建议的提示（严格约束输出格式）
function buildComparePrompt(plans: Plan[]): string {
  const rows = COMPARE_ROWS.map((row) => {
    const vals = plans.map((p) => row.getValue(p)).join(' | ');
    return `${row.label}: ${vals}`;
  }).join('\n');
  const labels = plans.map((p, i) => `${PLAN_LABELS[i]}（${p.planName || p.sceneName}）`).join('、');
  return `你是一个 IoT 选型专家。以下是 ${plans.length} 个方案的对比数据（${labels}）。

【严格输出规则】
1. 只输出中文，禁止任何英文内容
2. 禁止输出思考过程、推理步骤
3. 禁止使用任何 markdown 格式（**加粗**、- 列表等）
4. 禁止输出标题行
5. 只输出2至3句中文结论，控制在100字以内
6. 只比较：成本、功能覆盖、场景匹配度三个维度
7. 直接给出结论，例如："方案A实际花费最低；方案B功能覆盖最全，适合室外长期部署。预算敏感优先选A，功能优先选B。"

对比数据：
${rows}

现在直接输出2至3句中文建议：`;
}

// 检查某一行的值是否全部相同
function allSame(values: string[]): boolean {
  return values.every((v) => v === values[0]);
}

const ComparePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const plans: Plan[] = (location.state as { plans: Plan[] })?.plans ?? [];

  const [aiAdvice, setAiAdvice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const fetchedRef = useRef(false);

  // 调用 Edge Function 获取 AI 建议
  useEffect(() => {
    if (plans.length < 2 || fetchedRef.current) return;
    fetchedRef.current = true;
    setAiLoading(true);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    fetch(`${supabaseUrl}/functions/v1/minimax-m3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: buildComparePrompt(plans) }],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const raw: string =
          data?.choices?.[0]?.message?.content ||
          data?.reply ||
          '';
        setAiAdvice(cleanAiOutput(raw));
      })
      .catch(() => setAiAdvice('AI 建议加载失败，请返回重试。'))
      .finally(() => setAiLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (plans.length < 2) {
    return (
      <div className="flex min-h-screen flex-col page-bg">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <p className="text-[14px] text-muted-foreground">至少需要选择 2 个方案进行对比</p>
          <Button variant="outline" className="rounded-lg" onClick={() => navigate('/history')}>
            返回我的方案
          </Button>
        </div>
      </div>
    );
  }

  // 构建表格数据（设备类型行单独处理 display）
  const tableRows = COMPARE_ROWS.map((row) => ({
    label: row.label,
    values: plans.map((p) => row.getValue(p)),
    displayValues: plans.map((p) =>
      row.getDisplay ? row.getDisplay(p) : { short: row.getValue(p), full: row.getValue(p) }
    ),
  }));
  const diffFlags = tableRows.map((r) => !allSame(r.values));

  return (
    <div className="flex min-h-screen flex-col page-bg">
      <Header />
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          {/* 顶部标题栏 */}
          <div className="mb-6 flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => navigate('/history')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-[24px] font-bold text-foreground">方案对比</h1>
              <p className="text-[12px] text-muted-foreground">
                共对比 {plans.length} 个方案 · 星号（*）行表示差异项
              </p>
            </div>
          </div>

          {/* 对比表格卡片 */}
          <Card className="scene-card mb-4 rounded-[12px] border border-border bg-card shadow-card">
            <CardContent className="p-4">
              <p className="mb-3 text-[18px] font-medium text-foreground">参数对比表</p>
              <ScrollArea className="w-full">
                <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
                  <div className="mb-1 flex gap-0 font-mono text-[13px]">
                    <div className="w-[110px] shrink-0 font-semibold text-foreground">对比项</div>
                    {plans.map((p, i) => (
                      <div key={p.id} className="min-w-[140px] flex-1 font-semibold text-primary">
                        {PLAN_LABELS[i]}：{(p.planName || p.sceneName).slice(0, 8)}{(p.planName || p.sceneName).length > 8 ? '…' : ''}
                      </div>
                    ))}
                  </div>
                  <div className="mb-2 border-t border-border" />
                  {tableRows.map((row, idx) => (
                    <div
                      key={row.label}
                      className={`flex gap-0 rounded py-1 font-mono text-[13px] ${
                        diffFlags[idx] ? 'bg-[#FFFBEB]' : ''
                      }`}
                    >
                      <div className={`w-[110px] shrink-0 font-medium ${diffFlags[idx] ? 'text-[#92400E]' : 'text-muted-foreground'}`}>
                        {diffFlags[idx] ? '* ' : '  '}{row.label}
                      </div>
                      {row.displayValues.map((dv, vi) => (
                        <div
                          key={vi}
                          title={dv.full !== dv.short ? dv.full : undefined}
                          className={`min-w-[140px] flex-1 break-words leading-relaxed ${
                            dv.full !== dv.short ? 'cursor-help underline decoration-dotted' : ''
                          } ${
                            diffFlags[idx] ? 'font-semibold text-[#92400E]' : 'text-foreground'
                          }`}
                        >
                          {dv.short}
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
                    带 * 号的行为差异项（橙色高亮）
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* AI 建议卡片 */}
          <div className="advice-card">
            <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-foreground">
              <Lightbulb className="h-4 w-4 text-primary" />
              AI 综合建议
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                AI 分析中，请稍候...
              </div>
            ) : (
              <p className="text-[14px] leading-relaxed">{aiAdvice}</p>
            )}
          </div>

          {/* 底部返回按钮 */}
          <div className="mt-6 flex justify-center">
            <Button variant="outline" className="rounded-lg gap-2" onClick={() => navigate('/history')}>
              <ArrowLeft className="h-4 w-4" />
              返回我的方案
            </Button>
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default ComparePage;
