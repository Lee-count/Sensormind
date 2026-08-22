import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Share2, Copy, ClipboardCheck, Wand2, Trash2, Save, Check, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { fetchPlanById, updatePlanName, deletePlan } from '@/services/plans';
import { useSelection } from '@/contexts/SelectionContext';
import { toast } from 'sonner';
import { navigateToShareCard } from '@/pages/ShareCardPage';
import type { Plan } from '@/types';
import { Package } from 'lucide-react';

const PlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setScene, setMode, setFreeInput, setBaseConstraints, setPlan } = useSelection();

  const [plan, setPlanState] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [planName, setPlanName] = useState('');
  const [nameDirty, setNameDirty] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) { setLoadError(true); setLoading(false); return; }
    setLoading(true);
    fetchPlanById(id)
      .then((data) => {
        if (!data) { setLoadError(true); return; }
        setPlanState(data);
        setPlanName(data.planName || data.sceneName);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [id]);

  // 拓扑图中 [警告:...] 高亮为橙色块
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

  const handleSaveName = async () => {
    if (!plan || !id) return;
    if (!planName.trim()) { toast.error('方案名称不能为空'); return; }
    if (!nameDirty) return;
    setSavingName(true);
    try {
      await updatePlanName(id, planName.trim());
      setPlanState((prev) => (prev ? { ...prev, planName: planName.trim() } : prev));
      setNameDirty(false);
      setNameSaved(true);
      toast.success('方案名称已更新');
      setTimeout(() => setNameSaved(false), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败');
    } finally {
      setSavingName(false);
    }
  };

  const handleEditBasedOn = () => {
    if (!plan) return;
    setPlan(null);
    setScene({ id: plan.sceneName, name: plan.sceneName, icon: Package, description: '' });
    setMode('edit');
    setFreeInput('');
    setBaseConstraints({
      budget: plan.budget,
      precision: plan.precisionRequirement,
      communication: plan.communication,
      power: plan.powerSupply,
    });
    navigate('/chat');
  };

  const handleDelete = async () => {
    if (!plan || !id) return;
    setDeleting(true);
    try {
      await deletePlan(id);
      toast.success(`方案「${plan.planName || plan.sceneName}」已删除`);
      navigate('/history');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
      setDeleting(false);
    }
  };

  const handleCopy = async () => {
    if (!plan) return;
    const lines: string[] = [];
    lines.push('========== SensorMind 选型方案 ==========');
    lines.push(`方案名称：${planName || plan.planName || plan.sceneName}`);
    lines.push(`场景分类：${plan.sceneName}`);
    lines.push(`通信方式：${plan.communication} / 供电：${plan.powerSupply} / 精度：${plan.precisionRequirement}`);
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
    lines.push(`关键库：${plan.codeSuggestion.libraries.join('，') || '暂无'}`);
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

  // 加载中
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col page-bg">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-[14px] text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            加载方案详情...
          </div>
        </div>
      </div>
    );
  }

  // 加载失败 / 数据损坏
  if (loadError || !plan) {
    return (
      <div className="flex min-h-screen flex-col page-bg">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-[14px] text-muted-foreground">方案数据加载失败，可能已损坏</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="rounded-lg" onClick={() => navigate('/history')}>
              返回我的方案
            </Button>
            <Button onClick={() => navigate('/')} className="btn-press rounded-lg gradient-primary text-white shadow-primary">
              重新生成方案
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const days = Math.min(14, Math.max(1, Math.round(plan.devices.length * 0.5)));

  return (
    <div className="flex min-h-screen flex-col page-bg">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          {/* 顶部导航栏 */}
          <div className="mb-5 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigate('/history')} className="btn-press gap-1 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            <h1 className="text-[24px] font-bold text-foreground">方案详情</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToShareCard(plan, navigate)}
              className="btn-press gap-1 rounded-lg"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">分享</span>
            </Button>
          </div>

          <Card className="scene-card rounded-[12px] border border-border bg-card shadow-card">
            <CardContent className="space-y-5 p-4 md:p-5">

              {/* 方案信息区：可编辑名称 + 标签 */}
              <div>
                <label className="mb-1 block text-[14px] font-medium text-foreground">方案名称</label>
                <div className="flex gap-2">
                  <Input
                    value={planName}
                    onChange={(e) => { setPlanName(e.target.value); setNameDirty(true); setNameSaved(false); }}
                    className="h-10 flex-1 rounded-lg border-border bg-muted text-[14px] focus-visible:border-primary focus-visible:ring-primary/10"
                  />
                  <Button
                    onClick={handleSaveName}
                    disabled={!nameDirty || savingName}
                    className="btn-press h-10 shrink-0 gap-1 rounded-lg gradient-primary px-4 text-[14px] font-medium text-white shadow-primary"
                  >
                    {nameSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {nameSaved ? '已保存' : savingName ? '保存中' : '保存'}
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">

                </div>
              </div>

              {/* 统计卡片 */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '总预算', value: `¥${plan.totalCost.toFixed(0)}` },
                  { label: '设备种类', value: `${plan.devices.length} 类` },
                  { label: '预计工期', value: `${days} 天` },
                ].map((item) => (
                  <div key={item.label} className="panel-card flex flex-col items-center gap-0.5 p-3 text-center">
                    <span className="text-[18px] font-bold text-primary">{item.value}</span>
                    <span className="text-[12px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* 设备清单 */}
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
                <div className="mt-2 flex items-start gap-1.5 text-[12px] text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>接口检查：请核对主控引脚与各传感器/外设的对应关系，避免 I2C 地址冲突与 ADC 通道占用。</span>
                </div>
              </div>

              {/* 风险提示 */}
              {plan.riskTips && (
                <div>
                  <p className="mb-2 text-[18px] font-medium text-foreground">风险提示</p>
                  <div className="risk-card">
                    {plan.riskTips}
                  </div>
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

              {/* 底部操作按钮组 */}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  onClick={() => navigateToShareCard(plan, navigate)}
                  className="btn-press h-12 flex-1 gap-1 rounded-lg gradient-primary text-[16px] font-medium text-white shadow-primary"
                >
                  <Share2 className="h-4 w-4" />
                  分享方案
                </Button>
                <Button variant="outline" onClick={handleCopy} className="btn-press h-12 flex-1 gap-1 rounded-lg text-[16px] font-medium">
                  {copied ? <><ClipboardCheck className="h-4 w-4 text-green-600" /><span className="text-green-600">已复制</span></> : <><Copy className="h-4 w-4" />复制全文</>}
                </Button>
                <Button variant="outline" onClick={handleEditBasedOn} className="btn-press h-12 flex-1 gap-1 rounded-lg text-[16px] font-medium">
                  <Wand2 className="h-4 w-4" />
                  基于此修改
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={deleting}
                className="btn-press h-10 w-full gap-1 rounded-lg text-[14px] text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? '删除中...' : '删除方案'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default PlanDetailPage;