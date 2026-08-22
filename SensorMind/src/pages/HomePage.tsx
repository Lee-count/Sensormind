import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Bed, Sprout, FlaskConical, Factory, Warehouse, Sparkles, ChevronRight, BookOpen, Search, type LucideIcon, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSelection } from '@/contexts/SelectionContext';
import { toast } from 'sonner';
import type { Scene } from '@/types';
import { SHOWCASES } from '@/data/showcases';

interface HomeScene extends Scene {
  iconBg: string;
  iconColor: string;
}

const scenes: HomeScene[] = [
  { id: 'dorm', name: '宿舍智能', icon: Bed, description: '温湿度监测', iconBg: 'bg-[hsl(var(--scene-dorm-bg))]', iconColor: 'text-[hsl(var(--scene-dorm-fg))]' },
  { id: 'agri', name: '智慧农业', icon: Sprout, description: '自动灌溉', iconBg: 'bg-[hsl(var(--scene-agri-bg))]', iconColor: 'text-[hsl(var(--scene-agri-fg))]' },
  { id: 'lab', name: '实验室监测', icon: FlaskConical, description: '气体检测', iconBg: 'bg-[hsl(var(--scene-lab-bg))]', iconColor: 'text-[hsl(var(--scene-lab-fg))]' },
  { id: 'industry', name: '工业巡检', icon: Factory, description: '异常报警', iconBg: 'bg-[hsl(var(--scene-industry-bg))]', iconColor: 'text-[hsl(var(--scene-industry-fg))]' },
  { id: 'warehouse', name: '智能仓储', icon: Warehouse, description: '库存监测', iconBg: 'bg-[hsl(var(--scene-warehouse-bg))]', iconColor: 'text-[hsl(var(--scene-warehouse-fg))]' },
];

const showcaseMeta: Record<string, { gradient: string; icon: LucideIcon }> = {
  'dorm-env': { gradient: 'bg-gradient-to-br from-[#3B82F6] to-[#06B6D4]', icon: Bed },
  'greenhouse-irrigation': { gradient: 'bg-gradient-to-br from-[#22C55E] to-[#10B981]', icon: Sprout },
  'lab-gas-alarm': { gradient: 'bg-gradient-to-br from-[#8B5CF6] to-[#A855F7]', icon: FlaskConical },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38 } },
};

const GUIDE_STEPS = [
  { title: '描述你的项目需求', desc: '在这里输入，例如：宿舍温湿度监测，预算200元', placement: 'below' as const, radius: 'rounded-full' },
  { title: '从常见场景快速开始', desc: '也可以直接选择宿舍智能、智慧农业等场景模板', placement: 'below' as const, radius: 'rounded-[12px]' },
  { title: '看看别人怎么配', desc: '参考案例广场的经典方案，获取选型灵感', placement: 'above' as const, radius: 'rounded-[12px]' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setScene, setMode, setFreeInput, setPlan } = useSelection();
  const [inputValue, setInputValue] = useState('');

  // 首次进入引导（多步骤分阶段）
  const freeInputRef = useRef<HTMLDivElement>(null);
  const sceneGridRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [guideRect, setGuideRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [bubblePos, setBubblePos] = useState<{ top: number; arrow: 'top' | 'bottom' } | null>(null);

  const stepRefs = [freeInputRef, sceneGridRef, showcaseRef];
  const currentStep = GUIDE_STEPS[stepIndex];
  const isLastStep = stepIndex === GUIDE_STEPS.length - 1;

  const dismissGuide = () => {
    setShowGuide(false);
    try {
      localStorage.setItem('sensormind_onboarded', '1');
    } catch {
      // 忽略 localStorage 异常
    }
  };

  const nextStep = () => {
    if (isLastStep) { dismissGuide(); return; }
    setStepIndex((i) => i + 1);
  };
  const prevStep = () => setStepIndex((i) => Math.max(0, i - 1));

  // 读取目标元素在视口中的位置
  const readRect = () => {
    const el = stepRefs[stepIndex].current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setGuideRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  };

  // 切换步骤时：滚动目标元素到视口中央，再读取位置
  useEffect(() => {
    if (!showGuide) return;
    const el = stepRefs[stepIndex].current;
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    const raf = requestAnimationFrame(readRect);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGuide, stepIndex]);

  // 根据目标位置 + 气泡高度，计算气泡在视口内的安全位置
  // 用双 RAF 确保气泡已完成首次渲染，offsetHeight 已稳定
  useEffect(() => {
    if (!showGuide || !guideRect) return;
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const bubble = bubbleRef.current;
        const vh = window.innerHeight;
        const margin = 16;
        const gap = 16;
        // offsetHeight 在 opacity:0 时仍有效；fallback 220 仅防 null
        const bh = (bubble && bubble.offsetHeight > 0) ? bubble.offsetHeight : 220;
        const belowTop = guideRect.top + guideRect.height + gap;
        const aboveTop = guideRect.top - bh - gap;
        const fitsBelow = belowTop + bh <= vh - margin;
        const fitsAbove = aboveTop >= margin;
        let top: number;
        let arrow: 'top' | 'bottom';
        if (currentStep.placement === 'below' && fitsBelow) {
          top = belowTop; arrow = 'top';
        } else if (currentStep.placement === 'above' && fitsAbove) {
          top = aboveTop; arrow = 'bottom';
        } else {
          const spaceBelow = vh - (guideRect.top + guideRect.height);
          if (spaceBelow >= guideRect.top) {
            top = Math.min(belowTop, vh - bh - margin);
            arrow = 'top';
          } else {
            top = Math.max(aboveTop, margin);
            arrow = 'bottom';
          }
        }
        top = Math.min(Math.max(top, margin), vh - bh - margin);
        setBubblePos({ top, arrow });
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGuide, guideRect, stepIndex]);

  // 首次进入时触发引导
  useEffect(() => {
    try {
      if (localStorage.getItem('sensormind_onboarded') === '1') return;
    } catch {
      return;
    }
    const timer = setTimeout(() => setShowGuide(true), 900);
    return () => clearTimeout(timer);
  }, []);

  // 引导展示时：监听滚动/尺寸变化，实时重新定位
  useEffect(() => {
    if (!showGuide) return;
    window.addEventListener('scroll', readRect, true);
    window.addEventListener('resize', readRect);
    return () => {
      window.removeEventListener('scroll', readRect, true);
      window.removeEventListener('resize', readRect);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGuide, stepIndex]);

  const handleSceneSelect = (scene: Scene) => {
    setPlan(null);
    setMode('guided');
    setScene(scene);
    setFreeInput('');
    navigate('/chat');
  };

  const handleFreeInput = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      toast.error('请输入需求描述');
      return;
    }
    setPlan(null);
    setMode('free');
    setScene({ id: 'free', name: '自由描述', icon: Sparkles, description: trimmed });
    setFreeInput(trimmed);
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F4F8] to-white px-4 pb-[100px] pt-10">
      <div className="mx-auto max-w-5xl">
        {/* 品牌标题区 */}
        <section className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[32px] font-bold tracking-tight text-foreground"
          >
            SensorMind
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-2 text-[14px] text-muted-foreground"
          >
            AI 驱动的物联网设备选型助手
          </motion.p>
        </section>
        {/* 场景卡片区 */}
        <section className="mt-[60px]">
          <motion.div
            ref={sceneGridRef}
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          >
            {scenes.map((scene) => {
              const Icon = scene.icon;
              return (
                <motion.div key={scene.id} variants={item} className="h-full">
                  <button
                    type="button"
                    onClick={() => handleSceneSelect(scene)}
                    className="group flex h-full w-full flex-col items-center gap-3 rounded-[12px] border border-border bg-white/80 p-4 text-center backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary"
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${scene.iconBg}`}>
                      <Icon className={`h-6 w-6 ${scene.iconColor}`} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[16px] font-medium text-foreground">{scene.name}</h3>
                      <p className="text-[12px] text-muted-foreground">{scene.description}</p>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
        {/* 自由输入区 */}
        <section className="mx-auto mt-[80px] max-w-2xl">
          <motion.div
            ref={freeInputRef}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex h-14 items-center gap-2 rounded-full border border-border bg-muted p-1.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
          >
            <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="描述项目需求，如：宿舍温湿度监测，预算200元"
              className="h-full min-w-0 flex-1 bg-transparent px-2 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
              onKeyDown={(e) => { if (e.key === 'Enter') handleFreeInput(); }}
            />
            <Button
              onClick={handleFreeInput}
              className="btn-press h-11 shrink-0 gap-1 rounded-full px-6 text-[15px] font-semibold gradient-primary text-white shadow-md"
            >
              <Sparkles className="h-4 w-4" />
              生成
            </Button>
          </motion.div>
        </section>

        {/* 我的方案入口 */}
        <div className="mt-[40px] text-center">
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="group inline-flex items-center gap-1 text-[14px] text-muted-foreground transition-colors hover:text-primary"
          >
            我的方案
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* 案例广场 */}
        <motion.section
          ref={showcaseRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.78 }}
          className="mt-[60px]"
        >
          <div className="mb-5 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-[18px] font-bold text-foreground">看看别人怎么配</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SHOWCASES.map((sc) => {
              const meta = showcaseMeta[sc.id];
              const SIcon = meta?.icon ?? Sparkles;
              return (
                <Card
                  key={sc.id}
                  onClick={() => navigate(`/showcase/${sc.id}`)}
                  className="group cursor-pointer overflow-hidden rounded-[12px] border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:shadow-hover"
                >
                  <div className={`flex h-28 items-center justify-center ${meta?.gradient ?? 'gradient-primary'}`}>
                    <SIcon className="h-10 w-10 text-white" strokeWidth={1.5} />
                  </div>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap gap-1">
                      {sc.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <h3 className="text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {sc.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[13px]">
                      <span className="text-muted-foreground">参考预算</span>
                      <span className="font-bold text-primary">{sc.budget}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.section>
      </div>

      {/* 首次进入引导：高亮自由输入框 + 气泡提示 */}
      {showGuide && guideRect && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={nextStep}
          role="dialog"
          aria-modal="true"
          aria-label="使用引导"
        >
          {/* 半透明遮罩 */}
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" />

          {/* 高亮挖空框 + 脉冲动画 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className={`absolute border-2 border-primary ${currentStep.radius}`}
            style={{
              top: guideRect.top - 6,
              left: guideRect.left - 6,
              width: guideRect.width + 12,
              height: guideRect.height + 12,
              boxShadow: '0 0 0 9999px rgba(17,24,39,0.4)',
            }}
          >
            <span className={`absolute inset-0 animate-pulse border-2 border-primary/60 ${currentStep.radius}`} />
          </motion.div>

          {/* 气泡提示：fixed 定位 + Framer Motion 管理 x，避免 y 动画覆盖 CSS translateX */}
          <motion.div
            key={stepIndex}
            ref={bubbleRef}
            initial={{ opacity: 0, x: '-50%', y: 8 }}
            animate={{ opacity: bubblePos ? 1 : 0, x: '-50%', y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="fixed w-[calc(100vw-2rem)] max-w-sm"
            style={{ top: bubblePos?.top ?? -9999, left: '50%', zIndex: 70 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-[12px] border border-border bg-card p-4 shadow-hover">
              {bubblePos?.arrow === 'top' && (
                <span className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-border bg-card" />
              )}
              {bubblePos?.arrow === 'bottom' && (
                <span className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-border bg-card" />
              )}
              <p className="text-[14px] font-medium text-foreground">{currentStep.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{currentStep.desc}</p>

              {/* 进度指示 */}
              <div className="mt-3 flex items-center gap-1.5">
                {GUIDE_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === stepIndex ? 'w-5 bg-primary' : 'w-1.5 bg-border'}`}
                  />
                ))}
                <span className="ml-2 text-[12px] text-muted-foreground">
                  第 {stepIndex + 1}/{GUIDE_STEPS.length} 步
                </span>
              </div>

              {/* 操作按钮 */}
              <div className="mt-3 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); dismissGuide(); }}
                  className="rounded-lg text-[13px] text-muted-foreground hover:text-foreground"
                >
                  跳过引导
                </Button>
                <div className="flex gap-2">
                  {stepIndex > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); prevStep(); }}
                      className="rounded-lg text-[13px]"
                    >
                      上一步
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); nextStep(); }}
                    className="btn-press rounded-lg gradient-primary text-[13px] font-medium text-white shadow-primary"
                  >
                    {isLastStep ? '开始使用' : '下一步'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 右上角关闭按钮 */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); dismissGuide(); }}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
            aria-label="关闭引导"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default HomePage;
