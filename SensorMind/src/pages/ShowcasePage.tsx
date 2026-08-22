import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, ClipboardCheck, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { SHOWCASES } from '@/data/showcases';
import { toast } from 'sonner';

const ShowcasePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const showcase = SHOWCASES.find((s) => s.id === id);

  if (!showcase) {
    return (
      <div className="flex min-h-screen flex-col page-bg">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <p className="text-[14px] text-muted-foreground">案例不存在</p>
          <Button variant="outline" className="rounded-lg" onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const { plan } = showcase;

  // 渲染拓扑图中的 [警告:...] 高亮
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

  const handleCopy = async () => {
    const lines: string[] = [];
    lines.push('========== SensorMind 选型方案 ==========');
    lines.push(`方案名称：${plan.planName}`);
    lines.push(`场景分类：${plan.sceneName}`);
    lines.push(`来源：SensorMind 案例广场（只读展示）`);
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

          {/* 顶部蓝色提示条 */}
          <div className="advice-card mb-5 flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>这是案例广场的经典方案，返回首页可定制自己的方案</p>
          </div>

          {/* 页头 */}
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap gap-1">
                {showcase.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                    {tag}
                  </Badge>
                ))}
                <Badge className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                  案例广场 · 只读
                </Badge>
              </div>
              <h1 className="text-[24px] font-bold text-foreground">{showcase.title}</h1>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                参考预算 {showcase.budget} · 核心设备：{showcase.coreDevices.join('、')}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/')} className="btn-press shrink-0 gap-1 self-start rounded-lg">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Button>
          </div>

          <Card className="scene-card rounded-[12px] border border-border bg-card shadow-card">
            <CardContent className="space-y-5 p-4 md:p-5">

              {/* 基本参数 */}
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-[13px] sm:grid-cols-4">
                {[
                  { label: '预算范围', value: plan.budget },
                  { label: '通信方式', value: plan.communication },
                  { label: '供电方式', value: plan.powerSupply },
                  { label: '精度要求', value: plan.precisionRequirement },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-muted-foreground">{item.label}</p>
                    <p className="font-medium text-foreground">{item.value}</p>
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
                    `关键库：${plan.codeSuggestion.libraries.join('、') || '暂无'}`,
                    '引脚定义：',
                    ...(plan.codeSuggestion.pinDefinitions.length > 0 ? plan.codeSuggestion.pinDefinitions : ['暂无']),
                    '初始化步骤：',
                    plan.codeSuggestion.initCode || '暂无',
                  ].join('\n')}
                </pre>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={handleCopy} className="btn-press h-12 flex-1 gap-1 rounded-lg text-[16px] font-medium">
                  {copied
                    ? <><ClipboardCheck className="h-4 w-4 text-green-600" /><span className="text-green-600">已复制</span></>
                    : <><Copy className="h-4 w-4" />复制全文</>
                  }
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  className="btn-press h-12 flex-1 gap-1 rounded-lg gradient-primary text-[16px] font-medium text-white shadow-primary"
                >
                  <Sparkles className="h-4 w-4" />
                  我也要选型
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 底部引导 */}
          <p className="mt-4 text-center text-[12px] text-muted-foreground">
            想定制自己的方案？返回首页点击
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mx-1 font-medium text-primary hover:underline"
            >
              开始选型
            </button>
          </p>

        </motion.div>
      </main>
    </div>
  );
};

export default ShowcasePage;
