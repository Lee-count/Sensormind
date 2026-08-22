import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Save, ArrowLeft, RefreshCw, Copy, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSelection } from '@/contexts/SelectionContext';
import { savePlan } from '@/services/plans';
import { generateFreePlan, isValidIotInput } from '@/services/ai';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { plan, scene, setPlan, freeInput } = useSelection();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [planName, setPlanName] = useState(plan?.planName || plan?.sceneName || '');
  const [guideInput, setGuideInput] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  // 空方案判定：devices 为空或 totalCost 为 0
  const isEmptyPlan = !plan || plan.devices.length === 0 || plan.totalCost === 0;

  useEffect(() => {
    if (!plan || !scene) navigate('/', { replace: true });
  }, [plan, scene, navigate]);

  useEffect(() => {
    if (plan && !planName) setPlanName(plan.planName || plan.sceneName);
  }, [plan, planName]);

  if (!plan || !scene) return null;

  const displayText = plan.rawText || buildPlainText(plan);

  // 将拓扑图中 [警告:...] 和 [警告：...] 高亮为橙色块
  const renderTopologyWithWarnings = (text: string) => {
    const warningRegex = /(\[警告[：:][^\]]*\])/g;
    const parts = text.split(warningRegex);
    return parts.map((part, i) =>
      warningRegex.test(part) ? (
        <span key={i} className="warning-block inline-block">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const handleSave = async () => {
    if (saved) return;
    if (!planName.trim()) { toast.error('方案名称不能为空'); return; }
    setSaving(true);
    try {
      const planToSave = { ...plan, planName: planName.trim() };
      await savePlan(planToSave);
      setPlan(planToSave);
      setSaved(true);
      toast.success('方案保存成功！');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = () => { setPlan(null); navigate('/chat'); };

  // 引导模式：用户重新输入后提交
  const handleGuideSubmit = async (input: string) => {
    const text = input.trim();
    if (!text || regenerating) return;
    if (!isValidIotInput(text)) {
      toast.error('需求描述仍不够具体，请参考示例补充监测对象、场景或预算');
      return;
    }
    setRegenerating(true);
    try {
      const newPlan = await generateFreePlan(text);
      setPlan(newPlan);
      setPlanName(newPlan.planName || newPlan.sceneName);
      setSaved(false);
      toast.success('方案已重新生成');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = async () => {
    const now = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const lines: string[] = [];
    lines.push('========== SensorMind 选型方案 ==========');
    lines.push(`方案名称：${planName || plan.planName || plan.sceneName}`);
    lines.push(`生成时间：${now}`);
    lines.push('');
    lines.push('【设备清单】');
    plan.devices.forEach((d) =>
      lines.push(`${d.name}（${d.model}）x ${d.quantity}  单价 ¥${d.unitPrice.toFixed(2)}  ${d.purpose}`)
    );
    lines.push('');
    lines.push('【预算汇总】');
    plan.devices.forEach((d) =>
      lines.push(`${d.name} x ${d.quantity} = ¥${(d.quantity * d.unitPrice).toFixed(2)}`)
    );
    lines.push(`合计：¥${plan.totalCost.toFixed(2)}`);
    lines.push('');
    lines.push('【连接拓扑】');
    lines.push(plan.topology);
    lines.push('');
    lines.push('【风险提示】');
    lines.push(plan.riskTips || '暂无');
    lines.push('');
    lines.push('【代码框架】');
    lines.push(`框架：${plan.codeSuggestion.framework}`);
    lines.push(`关键库：${plan.codeSuggestion.libraries.join('、') || '暂无'}`);
    lines.push('引脚定义：');
    (plan.codeSuggestion.pinDefinitions.length > 0
      ? plan.codeSuggestion.pinDefinitions
      : ['暂无']
    ).forEach((p) => lines.push(p));
    lines.push('初始化步骤：');
    lines.push(plan.codeSuggestion.initCode || '暂无');
    lines.push('');
    lines.push('=====================================');
    lines.push('本方案由 SensorMind 生成，价格仅供参考。');

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      toast.success('内容已复制，可粘贴到文档或笔记中');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('复制失败，请手动选中内容复制');
    }
  };

  return (
    <div className="flex min-h-screen flex-col page-bg">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          {/* 页头：返回 + 方案名称编辑框 */}
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Button variant="outline" size="sm" onClick={() => navigate('/')} className="btn-press w-fit gap-1 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Button>
            <h1 className="text-[24px] font-bold text-foreground">
              {isEmptyPlan ? '项目信息不足' : '方案详情'}
            </h1>
          </div>

          <Card className="scene-card rounded-[12px] border border-border bg-card shadow-card">
            <CardContent className="space-y-5 p-4 md:p-5">
              {/* ── 空方案引导模式 ── */}
              {isEmptyPlan ? (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4 text-foreground shadow-sm">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="text-[13px] leading-relaxed">
                      <p className="mb-1 font-semibold text-[14px] text-primary">需求描述过于简单，无法生成方案</p>
                      <p className="text-muted-foreground">请告诉我更多信息，例如：</p>
                      <ul className="mt-1.5 space-y-0.5 list-none">
                        <li>• <span className="font-medium text-foreground">项目类型</span>：监测环境 / 控制设备 / 移动机器人 / 图像识别</li>
                        <li>• <span className="font-medium text-foreground">监测对象</span>：温湿度 / 空气质量 / 光照 / 距离 / 人体 / 土壤</li>
                        <li>• <span className="font-medium text-foreground">预算范围</span>：100元以内 / 100-300元 / 300-500元</li>
                        <li>• <span className="font-medium text-foreground">使用场景</span>：宿舍 / 大棚 / 实验室 / 工业 / 户外</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[14px] font-medium text-foreground">重新描述您的需求</label>
                    <div className="flex gap-2">
                      <Input
                        value={guideInput}
                        onChange={(e) => setGuideInput(e.target.value)}
                        placeholder="例如：我想做一个宿舍温湿度监测系统，预算200元"
                        className="h-11 flex-1 rounded-lg border-border bg-muted text-[14px] focus-visible:border-primary focus-visible:ring-primary/10"
                        onKeyDown={(e) => e.key === 'Enter' && handleGuideSubmit(guideInput)}
                        autoFocus
                      />
                      <Button
                        onClick={() => handleGuideSubmit(guideInput)}
                        disabled={!guideInput.trim() || regenerating}
                        className="btn-press h-11 shrink-0 rounded-lg gradient-primary px-4 text-[14px] font-medium text-white shadow-primary"
                      >
                        {regenerating ? '生成中...' : '生成方案'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[12px] text-muted-foreground">如果不知道怎么说，试试：</p>
                    <div className="flex flex-wrap gap-2">
                      {['宿舍温湿度监测', '循迹避障小车', '自动浇花系统', '人体感应报警', '空气质量监测'].map((item) => (
                        <Button
                          key={item}
                          variant="outline"
                          disabled={regenerating}
                          className="btn-press h-9 rounded-full border-primary/20 px-3 text-[12px] text-primary hover:border-primary/40 hover:bg-primary/10"
                          onClick={() => handleGuideSubmit(item)}
                        >
                          {item}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted p-4 text-center text-[13px] text-muted-foreground">
                    等待需求确认后生成连接拓扑图
                  </div>
                  <div className="rounded-lg bg-muted p-4 text-center text-[13px] text-muted-foreground">
                    等待需求确认后生成代码框架
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button disabled onClick={() => {}} className="btn-press flex-1 gap-1 rounded-lg gradient-primary text-white opacity-40 cursor-not-allowed">
                      <Save className="h-4 w-4" />请先生成有效方案
                    </Button>
                    <Button variant="outline" disabled onClick={() => {}} className="btn-press flex-1 gap-1 rounded-lg opacity-40 cursor-not-allowed">
                      <Copy className="h-4 w-4" />复制全文
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/chat')} className="btn-press flex-1 gap-1 rounded-lg">
                      <RefreshCw className="h-4 w-4" />重新生成
                    </Button>
                  </div>
                </motion.div>
              ) : (
                /* ── 正常方案内容 ── */
                <>
                  {/* 方案名称编辑框 */}
                  <div>
                    <label className="mb-1 block text-[14px] font-medium text-foreground">方案名称</label>
                    <Input
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      placeholder="为方案起个名字"
                      className="h-10 rounded-lg border-border bg-muted text-[14px] focus-visible:border-primary focus-visible:ring-primary/10"
                    />
                  </div>

                  {/* 统计卡片：总预算 / 设备种类 / 工期 */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '总预算', value: `¥${plan.totalCost.toFixed(0)}` },
                      { label: '设备种类', value: `${plan.devices.length} 类` },
                      { label: '预计工期', value: `${Math.min(14, Math.max(1, Math.round(plan.devices.length * 0.5)))} 天` },
                    ].map((item) => (
                      <div key={item.label} className="panel-card flex flex-col items-center gap-0.5 p-3 text-center">
                        <span className="text-[18px] font-bold text-primary">{item.value}</span>
                        <span className="text-[12px] text-muted-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* 设备清单表格 */}
                  <div>
                    <p className="mb-2 text-[18px] font-medium text-foreground">设备清单</p>
                    <div className="w-full max-w-full overflow-x-auto rounded-lg border border-border bg-card">
                      <table className="min-w-max w-full text-[14px]">
                        <thead>
                          <tr className="bg-[#F8FAFC] text-[#374151]">
                            <th className="whitespace-nowrap border-b border-border px-4 py-2 text-left font-medium">设备类型</th>
                            <th className="whitespace-nowrap border-b border-border px-4 py-2 text-left font-medium">推荐型号</th>
                            <th className="whitespace-nowrap border-b border-border px-4 py-2 text-right font-medium">数量</th>
                            <th className="whitespace-nowrap border-b border-border px-4 py-2 text-right font-medium">参考单价</th>
                            <th className="whitespace-nowrap border-b border-border px-4 py-2 text-right font-medium">小计</th>
                            <th className="whitespace-nowrap border-b border-border px-4 py-2 text-left font-medium">用途说明</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.devices.map((d, i) => (
                            <tr
                              key={i}
                              className={`border-t border-border text-[#4B5563] transition-colors hover:bg-[#F0F9FF] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                            >
                              <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{d.name}</td>
                              <td className="whitespace-nowrap px-4 py-3">{d.model}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-right">{d.quantity}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-primary">¥{d.unitPrice.toFixed(2)}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-primary">¥{(d.quantity * d.unitPrice).toFixed(2)}</td>
                              <td className="px-4 py-3">{d.purpose}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-border bg-[#EFF6FF]">
                            <td colSpan={4} className="px-4 py-3 text-right font-bold text-[#1E40AF]">合计</td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-[16px] font-bold text-[#1E40AF]">
                              ¥{plan.totalCost.toFixed(2)}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* 连接拓扑 */}
                  <div>
                    <p className="mb-2 text-[18px] font-medium text-foreground">连接拓扑</p>
                    <div className="panel-card overflow-x-auto p-4">
                      <pre className="whitespace-pre font-mono text-[13px] leading-relaxed text-[#374151]">
                        {renderTopologyWithWarnings(plan.topology)}
                      </pre>
                    </div>
                  </div>

                  {/* 风险提示 */}
                  {plan.riskTips && (
                    <div className="risk-card">
                      {plan.riskTips}
                    </div>
                  )}

                  {/* 代码框架 */}
                  <div>
                    <p className="mb-2 text-[18px] font-medium text-foreground">代码框架</p>
                    <pre className="code-block whitespace-pre-wrap break-words">
                      {[
                        `框架：${plan.codeSuggestion.framework}`,
                        `关键库：${plan.codeSuggestion.libraries.join('，') || '暂无'}`,
                        '引脚定义：',
                        ...(plan.codeSuggestion.pinDefinitions.length > 0 ? plan.codeSuggestion.pinDefinitions : ['暂无']),
                        '初始化步骤：',
                        plan.codeSuggestion.initCode || '暂无',
                      ].join('\n')}
                    </pre>
                  </div>

                  {/* 底部按钮组 */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={handleSave}
                      disabled={saving || saved}
                      className={`btn-press h-12 flex-1 gap-1 rounded-lg text-[16px] font-medium ${
                        saved ? 'bg-green-600 hover:bg-green-600 text-white' : 'gradient-primary text-white shadow-primary'
                      }`}
                    >
                      {saved ? <><Check className="h-4 w-4" />已保存</> : <><Save className="h-4 w-4" />{saving ? '保存中...' : '保存方案'}</>}
                    </Button>
                    <Button variant="outline" onClick={handleCopy} className="btn-press h-12 flex-1 gap-1 rounded-lg text-[16px] font-medium">
                      {copied ? <><ClipboardCheck className="h-4 w-4 text-green-600" /><span className="text-green-600">已复制</span></> : <><Copy className="h-4 w-4" />复制全文</>}
                    </Button>
                    <Button variant="outline" onClick={() => { setPlan(null); navigate('/chat'); }} className="btn-press h-12 flex-1 gap-1 rounded-lg text-[16px] font-medium">
                      <RefreshCw className="h-4 w-4" />
                      重新生成
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

function buildPlainText(plan: NonNullable<ReturnType<typeof useSelection>['plan']>): string {
  const lines: string[] = [];
  lines.push('【设备清单】');
  plan.devices.forEach((d) => lines.push(`${d.name} | ${d.model} | 数量 ${d.quantity} | 单价 ¥${d.unitPrice.toFixed(2)} | ${d.purpose}`));
  lines.push('');
  lines.push('【预算汇总】');
  plan.devices.forEach((d) => lines.push(`${d.name} x ${d.quantity} = ¥${(d.quantity * d.unitPrice).toFixed(2)}`));
  lines.push(`合计：¥${plan.totalCost.toFixed(2)}`);
  lines.push('');
  lines.push('【连接拓扑】');
  lines.push(plan.topology);
  lines.push('');
  lines.push('【风险提示】');
  lines.push(plan.riskTips || '暂无');
  lines.push('');
  lines.push('【代码框架】');
  lines.push(`框架：${plan.codeSuggestion.framework}`);
  lines.push(`关键库：${plan.codeSuggestion.libraries.join('，') || '暂无'}`);
  lines.push('引脚定义：');
  plan.codeSuggestion.pinDefinitions.length > 0 ? plan.codeSuggestion.pinDefinitions.forEach((p) => lines.push(p)) : lines.push('暂无');
  lines.push('初始化步骤：');
  lines.push(plan.codeSuggestion.initCode || '暂无');
  return lines.join('\n');
}

export default ResultPage;
