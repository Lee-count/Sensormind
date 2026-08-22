import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Download, Copy, ClipboardCheck, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Plan } from '@/types';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';

const APP_URL = 'https://app-d97tc5wfrqwx.appmiaoda.com';
const STORAGE_KEY = 'sensorMindShareCard';

// 从方案数据提炼一句话亮点
function extractHighlight(plan: Plan): string {
  const commMap: Record<string, string> = {
    'WiFi': 'WiFi上传手机，',
    '蓝牙BLE': '蓝牙低功耗连接，',
    '4G/NB-IoT': '4G远程联网，',
    'LoRa': 'LoRa远距离通信，',
    '有线（UART/I2C/SPI）': '本地有线通信，',
    'ZigBee': 'ZigBee组网，',
  };
  const prefix = commMap[plan.communication] ?? '';
  const deviceNames = plan.devices.slice(0, 3).map((d) => d.name).join('+');
  return `${prefix}${deviceNames} 一站式监测，开箱即用`;
}

// 估算工期天数（设备数 * 0.5，最少1天最多14天）
function estimateDays(plan: Plan): number {
  return Math.min(14, Math.max(1, Math.round(plan.devices.length * 0.5)));
}

const ShareCardPage: React.FC = () => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // 从 sessionStorage 读取方案数据
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPlan(JSON.parse(raw) as Plan);
      }
    } catch {
      toast.error('无法读取方案数据，请重新进入');
    }
  }, []);

  if (!plan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 page-bg px-4">
        <p className="text-[14px] text-muted-foreground">方案数据不存在，请从【我的方案】重新进入</p>
        <Button variant="outline" className="rounded-lg" onClick={() => navigate('/history')}>
          返回我的方案
        </Button>
      </div>
    );
  }

  const highlight = extractHighlight(plan);
  const days = estimateDays(plan);
  const coreDeviceNames = plan.devices.map((d) => d.model || d.name);

  // ─── 复制分享文本 ───────────────────────────────────────────────
  const handleCopyText = async () => {
    const lines = [
      '========== SensorMind 方案分享 ==========',
      `方案：${plan.planName || plan.sceneName}`,
      `场景：${plan.sceneName} | 预算：¥${plan.totalCost.toFixed(0)}`,
      `核心设备：${coreDeviceNames.join('、')}`,
      `亮点：${highlight}`,
      `完整体验：${APP_URL}`,
      '=========================================',
      '文本已复制，可粘贴到微信/QQ/邮件',
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      toast.success('文本已复制，可粘贴到微信/QQ/邮件');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('复制失败，请手动长按文字复制');
    }
  };

  // ─── 保存为图片 ─────────────────────────────────────────────────
  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      // 动态导入，避免首屏体积膨胀
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8f9fa',
        logging: false,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `SensorMind_${plan.planName || plan.sceneName}.png`;
      a.click();
      toast.success('图片已保存到下载文件夹');
    } catch {
      toast.error('截图失败，请使用手机截图功能保存此卡片', { duration: 4000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen page-bg px-4 py-8">
      {/* 页头操作栏 */}
      <div className="mx-auto mb-6 flex max-w-[640px] items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="btn-press gap-1 rounded-lg"
          onClick={() => navigate('/history')}
        >
          <ArrowLeft className="h-4 w-4" />
          返回我的方案
        </Button>
        <p className="text-[14px] font-bold text-primary">SensorMind</p>
      </div>
      {/* ─── 分享卡片（固定宽度 600px，专为截图设计）─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto w-full max-w-[640px]"
      >
        <div
          ref={cardRef}
          className="overflow-hidden rounded-2xl bg-[#f8f9fa] shadow-xl"
          style={{ fontFamily: "'Alibaba PuHuiTi', sans-serif" }}
        >
          {/* 顶部品牌栏 */}
          <div
            className="flex items-center justify-between px-7 py-5"
            style={{ background: 'linear-gradient(135deg, #0066FF 0%, #00B4D8 100%)' }}
          >
            <div>
              <p className="text-[22px] font-bold leading-tight text-white tracking-tight">
                SensorMind
              </p>
              <p className="text-[13px] text-white/80">让硬件选型变简单</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-white stroke-[1.5]">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </div>
          </div>

          {/* 中间主卡 */}
          <div className="px-7 py-6">
            {/* 方案名称 */}
            <h1 className="mb-3 text-[22px] font-bold leading-tight text-foreground">
              {plan.planName || plan.sceneName}
            </h1>

            {/* 场景标签 */}
            <div className="mb-4 flex flex-wrap gap-2">

            </div>

            {/* 核心指标一行 */}
            <div className="mb-5 flex items-center gap-0 divide-x divide-border overflow-hidden rounded-xl border border-border bg-white">
              {[
                { label: '总预算', value: `¥${plan.totalCost.toFixed(0)}` },
                { label: '设备种类', value: `${plan.devices.length} 类` },
                { label: '预计工期', value: `${days} 天` },
              ].map((item) => (
                <div key={item.label} className="flex-1 px-4 py-3 text-center">
                  <p className="text-[18px] font-bold text-primary">{item.value}</p>
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            {/* 设备清单完整版 */}
            <div className="mb-5">
              <p className="mb-2 text-[13px] font-semibold text-foreground">设备清单</p>
              <div className="space-y-1.5">
                {plan.devices.map((d, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px]"
                  >
                    <span className="truncate text-left font-medium text-foreground">{d.name}</span>
                    <span className="truncate text-center text-muted-foreground">{d.model}</span>
                    <span className="whitespace-nowrap text-right font-bold text-primary">
                      ¥{d.unitPrice.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 一句话亮点 */}
            <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-[13px] font-medium text-primary">
                ✦ {highlight}
              </p>
            </div>

            {/* 二维码 + 底部提示 */}
            <div className="flex items-center gap-4 rounded-xl bg-white px-4 py-3">
              <div className="shrink-0">
                <QRCodeDataUrl text={APP_URL} width={72} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground">扫码体验完整功能</p>
                <p className="mt-0.5 break-all text-[11px] text-muted-foreground">{APP_URL}</p>
              </div>
            </div>
          </div>

          {/* 底部声明 */}
          <div className="border-t border-border bg-white px-7 py-3 text-center">
            <p className="text-[11px] text-muted-foreground">
              SensorMind 生成 &nbsp;|&nbsp; 价格仅供参考
            </p>
          </div>
        </div>
      </motion.div>
      {/* ─── 操作按钮区 ─── */}
      <div className="mx-auto mt-6 flex max-w-[640px] flex-col gap-3 sm:flex-row">
        <Button
          onClick={handleSaveImage}
          disabled={saving}
          className="btn-press h-12 flex-1 gap-2 rounded-lg gradient-primary text-[16px] font-medium text-white shadow-primary"
        >
          {saving ? (
            <><ImageOff className="h-4 w-4 animate-pulse" />生成中...</>
          ) : (
            <><Download className="h-4 w-4" />保存为图片</>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleCopyText}
          className="btn-press h-12 flex-1 gap-2 rounded-lg text-[16px] font-medium"
        >
          {copied ? (
            <><ClipboardCheck className="h-4 w-4 text-green-600" /><span className="text-green-600">已复制</span></>
          ) : (
            <><Copy className="h-4 w-4" />复制分享文本</>
          )}
        </Button>
      </div>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        不支持截图时，请使用手机截图功能保存此卡片
      </p>
    </div>
  );
};

// 工具函数：将方案存入 sessionStorage 并跳转
export function navigateToShareCard(plan: Plan, navigateFn: (path: string) => void) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  navigateFn('/share-card');
}

export default ShareCardPage;
