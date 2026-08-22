import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Send, Wand2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useSelection } from '@/contexts/SelectionContext';
import { generatePlan, generateFreePlan, parseFreeInput, isValidIotInput } from '@/services/ai';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import type { ConflictAnalysis } from '@/types';

interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
  conflictAnalysis?: ConflictAnalysis | null;
}

// 各场景专属功能菜单
const SCENE_FUNCTIONS: Record<string, { question: string; options: string[]; linkageQuestion: string; linkageOptions: string[] }> = {
  '宿舍智能': {
    question: '在宿舍场景下，你想实现什么功能？可以选择多个。',
    options: [
      '温湿度监测（防止发霉、空调联动）',
      '空气质量监测（CO2、甲醛、异味）',
      '人体感应与安防（无人时自动断电、防盗）',
      '智能台灯与氛围灯控制',
      '噪音监测与提醒',
      '多参数综合环境监测',
    ],
    linkageQuestion: '是否需要联动控制？例如温度超过28度自动开启风扇，或湿度超过70%自动报警？',
    linkageOptions: ['需要联动控制', '仅监测即可'],
  },
  '智慧农业': {
    question: '在农业场景下，你想实现什么功能？可以选择多个。',
    options: [
      '土壤温湿度监测',
      '土壤酸碱度pH监测',
      '环境光照强度监测',
      '自动灌溉控制',
      '大棚温湿度调控',
      '病虫害预警',
      '多参数综合监测',
    ],
    linkageQuestion: '是否需要自动控制？例如土壤湿度低于阈值自动开启水泵，或光照不足自动补光？',
    linkageOptions: ['需要自动控制', '仅监测即可'],
  },
  '实验室监测': {
    question: '在实验室场景下，你想实现什么功能？可以选择多个。',
    options: [
      '环境温湿度记录与报警',
      '有害气体泄漏监测（CO、VOC、NH3）',
      '精密设备运行状态监控',
      '培养箱与恒温箱温度监控',
      '通风橱风速监测',
      '实验室门禁与人员记录',
      '多参数综合监测',
    ],
    linkageQuestion: '是否需要超限报警？例如温度超过设定值蜂鸣器报警，或气体泄漏时自动通风？',
    linkageOptions: ['需要报警联动', '仅记录数据'],
  },
  '工业巡检': {
    question: '在工业场景下，你想实现什么功能？可以选择多个。',
    options: [
      '设备振动与异常检测',
      '电机与轴承温度监测',
      '环境温湿度与粉尘监测',
      '管道压力与流量监测',
      '设备运行状态联网上报',
      '危险区域人员靠近报警',
      '多参数综合监测',
    ],
    linkageQuestion: '是否需要异常上报？例如振动超标自动通知管理人员，或温度异常触发停机保护？',
    linkageOptions: ['需要联动上报', '仅监测记录'],
  },
  '智能仓储': {
    question: '在仓储场景下，你想实现什么功能？可以选择多个。',
    options: [
      '仓库温湿度监测（冷链、药品、食品仓储适用）',
      '库存盘点与货物定位（RFID、条码、重量感应）',
      '货架承重与倾斜监测',
      '人员进出与安防监控',
      '烟雾与火灾预警',
      '照明节能自动控制',
      '多参数综合环境监测',
    ],
    linkageQuestion: '是否需要自动联动？例如温湿度超标自动开启空调或除湿机，或火灾预警自动触发声光报警并通知管理员？',
    linkageOptions: ['需要联动控制', '仅监测记录'],
  },
};

// 通用部署环境选项
const DEPLOY_ENV_OPTIONS = [
  '室内常温干燥',
  '室内潮湿环境',
  '户外有遮挡',
  '户外无遮挡（需防水防晒）',
  '特殊环境（高温、高粉尘、强电磁干扰等）',
  '不确定，先按常规推荐',
];

// 技术约束问题
const TECH_QUESTIONS = [
  { key: 'budget', title: '请确认预算范围', options: ['200 元以内', '200-500 元', '500-1000 元', '1000 元以上'] },
  { key: 'precision', title: '传感器精度要求是什么级别？', options: ['入门级（够用即可）', '标准级（±1% 左右）', '高精度（±0.1% 或更高）'] },
  { key: 'communication', title: '偏好哪种通信方式？', options: ['有线（UART/I2C/SPI）', '蓝牙', 'WiFi', 'LoRa'] },
  { key: 'power', title: '项目采用什么供电方式？', options: ['USB/适配器供电', '电池供电（低功耗优先）', '太阳能+电池'] },
];

// 引导步骤枚举
const STEP_GOALS = 0;      // 场景专属功能多选
const STEP_LINKAGE = 1;    // 联动控制追问
const STEP_ENV = 2;        // 部署环境
const STEP_TECH = 3;       // 技术约束（4问）

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { scene, mode, freeInput, baseConstraints, setPlan } = useSelection();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [guidedStep, setGuidedStep] = useState(STEP_GOALS);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [linkageChoice, setLinkageChoice] = useState('');
  const [deployEnv, setDeployEnv] = useState('');
  const [techAnswers, setTechAnswers] = useState<Record<string, string>>({});
  const [techQuestionIdx, setTechQuestionIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [freeText, setFreeText] = useState('');
  const [freeStage, setFreeStage] = useState(0);
  const [freeConstraints, setFreeConstraints] = useState<Record<string, string>>({});
  const [freeOptions, setFreeOptions] = useState<string[]>([]);
  const [freeQuestion, setFreeQuestion] = useState('');
  // 无效输入引导模式
  const [guideMode, setGuideMode] = useState(false);
  const [guideText, setGuideText] = useState('');
  const [invalidCount, setInvalidCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 当前场景配置（回退到通用选项）
  const sceneConfig = scene ? (SCENE_FUNCTIONS[scene.name] ?? {
    question: '你想在这个场景下实现什么功能？可以选择多个。',
    options: ['温湿度监测', '空气质量监测', '光照强度监测', '人体感应与安防', '设备远程控制', '多参数综合监测'],
    linkageQuestion: '是否需要联动控制？',
    linkageOptions: ['需要联动控制', '仅监测即可'],
  }) : null;

  useEffect(() => {
    if (!scene) { navigate('/', { replace: true }); return; }
    if (mode === 'guided') {
      setMessages([{
        role: 'ai',
        content: `已选择场景「${scene.name}」。接下来我会引导你明确需求，为你生成个性化选型方案。\n\n${sceneConfig?.question ?? ''}`,
      }]);
      setGuidedStep(STEP_GOALS);
      setSelectedGoals([]);
      setCustomGoal('');
      setLinkageChoice('');
      setDeployEnv('');
      setTechAnswers({});
      setTechQuestionIdx(0);
    } else if (mode === 'free') {
      setMessages([{ role: 'user', content: freeInput }]);
      handleFreeGenerate(freeInput);
    } else {
      setMessages([{ role: 'ai', content: `已加载方案「${scene.name}」的约束：预算 ${baseConstraints?.budget || '未指定'}、精度 ${baseConstraints?.precision || '未指定'}、通信 ${baseConstraints?.communication || '未指定'}、供电 ${baseConstraints?.power || '未指定'}。请告诉我你想做哪些修改？` }]);
      setFreeStage(0);
      setFreeConstraints(baseConstraints || {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.name, mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, loading]);

  // ── 步骤0：功能目标多选 ──
  const handleToggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleConfirmGoals = () => {
    const allGoals = [...selectedGoals];
    if (customGoal.trim()) allGoals.push(customGoal.trim());
    if (allGoals.length === 0) return;
    const goalsText = allGoals.join('、');
    setSelectedGoals(allGoals);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: goalsText },
      { role: 'ai', content: `已选择功能目标：${goalsText}。\n\n${sceneConfig?.linkageQuestion ?? ''}` },
    ]);
    setGuidedStep(STEP_LINKAGE);
  };

  // ── 步骤1：联动控制追问 ──
  const handleSelectLinkage = (choice: string) => {
    setLinkageChoice(choice);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: choice },
      { role: 'ai', content: `好的，已记录联动偏好：${choice}。\n\n设备将部署在什么环境？` },
    ]);
    setGuidedStep(STEP_ENV);
  };

  // ── 步骤2：部署环境 ──
  const handleSelectEnv = (env: string) => {
    setDeployEnv(env);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: env },
      { role: 'ai', content: `部署环境已确认：${env}。\n\n接下来确认技术偏好。\n\n${TECH_QUESTIONS[0].title}` },
    ]);
    setGuidedStep(STEP_TECH);
    setTechQuestionIdx(0);
  };

  // ── 步骤3：技术约束（4问）──
  const handleGuidedAnswer = async (option: string) => {
    if (loading) return;
    const question = TECH_QUESTIONS[techQuestionIdx];
    const nextAnswers = { ...techAnswers, [question.key]: option };
    setTechAnswers(nextAnswers);
    setMessages((prev) => [...prev, { role: 'user', content: option }]);
    if (techQuestionIdx < TECH_QUESTIONS.length - 1) {
      const nextIdx = techQuestionIdx + 1;
      setTechQuestionIdx(nextIdx);
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'ai', content: TECH_QUESTIONS[nextIdx].title }]);
      }, 400);
    } else {
      setLoading(true);
      await generateAndGo({
        ...nextAnswers,
        goals: selectedGoals.join('、'),
        linkage: linkageChoice,
        deployEnv,
      });
      setLoading(false);
    }
  };

  // ── 自由/编辑模式 ──
  // ── 通用推理引擎（free 模式专用，无追问直接出方案）──
  const handleFreeGenerate = async (input: string) => {
    // 前置校验：无效输入进入引导模式
    if (!isValidIotInput(input)) {
      const newCount = invalidCount + 1;
      setInvalidCount(newCount);
      setGuideMode(true);
      setGuideText('');
      setLoading(false);
      return;
    }
    setGuideMode(false);
    setLoading(true);
    try {
      setMessages((prev) => [...prev, { role: 'ai', content: '正在分析需求，推导硬件方案...' }]);
      const plan = await generateFreePlan(input);
      setPlan(plan);
      setMessages((prev) => [...prev, { role: 'ai', content: `已为「${plan.planName || plan.sceneName}」生成方案，正在跳转...` }]);
      setTimeout(() => navigate('/result'), 600);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '方案生成失败');
      setMessages((prev) => [...prev, { role: 'ai', content: '方案生成出错，请重试或换一种描述方式。' }]);
    } finally {
      setLoading(false);
    }
  };

  // 引导模式：用户在引导框重新输入后提交
  const handleGuideSubmit = async () => {
    const text = guideText.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setGuideText('');
    await handleFreeGenerate(text);
  };

  // 快捷选项点击：填充并直接生成
  const handleQuickPick = async (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    await handleFreeGenerate(text);
  };

  const handleFreeParse = async (input: string, stage: number, constraints: Record<string, string>) => {
    setLoading(true);
    try {
      const result = await parseFreeInput(input, stage, constraints);
      if (result.type === 'plan') { await generateAndGo(result.constraints); return; }
      if (stage >= 1 && result.missingKeys.length > 0) {
        const filled = { ...result.constraints };
        for (const key of result.missingKeys) {
          if (key === 'budget') filled[key] = '200-500 元';
          if (key === 'precision') filled[key] = '标准级（±1% 左右）';
          if (key === 'communication') filled[key] = 'WiFi';
          if (key === 'power') filled[key] = 'USB/适配器供电';
        }
        await generateAndGo(filled);
        return;
      }
      setFreeStage(stage + 1);
      setFreeConstraints(result.constraints);
      setFreeQuestion(result.question);
      setFreeOptions(result.options);
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: result.message,
        conflictAnalysis: result.conflictAnalysis ?? null,
      }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '解析失败');
      setMessages((prev) => [...prev, { role: 'ai', content: '需求解析出错，请尝试重新描述。' }]);
    } finally {
      setLoading(false);
    }
  };

  const generateAndGo = async (constraints: Record<string, string>) => {
    try {
      const plan = await generatePlan(scene!.name, constraints);
      setPlan(plan);
      setMessages((prev) => [...prev, { role: 'ai', content: '已根据你的需求生成方案，正在跳转...' }]);
      setTimeout(() => navigate('/result'), 600);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '方案生成失败');
      setMessages((prev) => [...prev, { role: 'ai', content: '方案生成出错，请重试。' }]);
    }
  };

  const handleFreeSubmit = async () => {
    const text = freeText.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setFreeText('');
    // free 模式：补充输入也直接走通用推理引擎（把历史上下文拼接进去）
    const fullInput = freeInput ? `${freeInput}。补充信息：${text}` : text;
    await handleFreeGenerate(fullInput);
  };

  const handleFreeOption = async (option: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: option }]);
    const nextConstraints = { ...freeConstraints, [freeQuestion]: option };
    setFreeConstraints(nextConstraints);
    await handleFreeParse(option, freeStage, nextConstraints);
  };

  const handleEditSubmit = async () => {
    const text = freeText.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setFreeText('');
    await handleFreeParse(text, 0, freeConstraints);
  };

  const Icon = scene?.icon;
  const title = mode === 'guided' ? scene?.name || 'AI 选型助手' : mode === 'free' ? '自由描述选型' : '基于方案修改';
  const stepLabel =
    guidedStep === STEP_GOALS ? '第一步：功能目标（可多选）' :
    guidedStep === STEP_LINKAGE ? '第二步：联动控制需求' :
    guidedStep === STEP_ENV ? '第三步：部署环境' :
    '第四步：技术约束确认';
  const subtitle =
    mode === 'guided' ? stepLabel :
    mode === 'free' ? 'AI 会解析你的需求并生成方案' :
    '在原方案基础上追加修改指令';

  const showGoalSelect = mode === 'guided' && guidedStep === STEP_GOALS && !loading;
  const showLinkageOptions = mode === 'guided' && guidedStep === STEP_LINKAGE && !loading;
  const showEnvOptions = mode === 'guided' && guidedStep === STEP_ENV && !loading;
  const showTechOptions = mode === 'guided' && guidedStep === STEP_TECH && !loading;
  const showFreeOptions = (mode === 'free' || mode === 'edit') && freeOptions.length > 0 && !loading;
  const showInput = (mode === 'free' || mode === 'edit') && freeOptions.length === 0 && !loading;

  return (
    <div className="flex min-h-screen flex-col page-bg">
      <Header />

      {/* 场景信息栏 */}
      <div className="mx-auto w-full max-w-3xl px-4 pt-4">
        <div className="mb-3 flex items-center gap-3">
          {Icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-primary text-white shadow-primary">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">{title}</h2>
            <p className="text-[12px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* 消息区 */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">
        <ScrollArea className="flex-1 rounded-xl border border-border bg-card">
          <div className="space-y-4 p-4 pb-2">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[88%] md:max-w-[80%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                    <div
                      className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                        msg.role === 'user' ? 'bubble-user' : 'bubble-ai'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {/* 约束博弈分析块（仅 AI 消息且有冲突时渲染） */}
                    {msg.role === 'ai' && msg.conflictAnalysis && msg.conflictAnalysis.rows.length > 0 && (
                      <ConflictBlock analysis={msg.conflictAnalysis} />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="bubble-ai flex items-center gap-2 rounded-2xl px-4 py-3 text-[14px] text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  AI 思考中...
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* 交互区 */}
        <div className="py-3 space-y-2">

          {/* 步骤0：场景专属功能多选 + 自定义输入 */}
          {showGoalSelect && sceneConfig && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sceneConfig.options.map((goal) => (
                  <Button
                    key={goal}
                    variant="outline"
                    className={`btn-press h-auto min-h-[48px] justify-start rounded-lg border px-4 py-3 text-left text-[14px] font-normal transition-colors ${
                      selectedGoals.includes(goal)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary hover:bg-primary/5 hover:text-primary'
                    }`}
                    onClick={() => handleToggleGoal(goal)}
                  >
                    {goal}
                  </Button>
                ))}
              </div>
              {/* 自定义功能输入 */}
              <div className="flex gap-2">
                <Input
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="自定义功能（选填，回车即可追加）"
                  className="h-10 flex-1 rounded-lg border-border bg-white text-[14px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customGoal.trim()) {
                      handleToggleGoal(customGoal.trim());
                      setCustomGoal('');
                    }
                  }}
                />
              </div>
              <Button
                className="btn-press w-full rounded-lg gradient-primary text-white shadow-primary"
                disabled={selectedGoals.length === 0 && !customGoal.trim()}
                onClick={handleConfirmGoals}
              >
                确认已选功能目标（{selectedGoals.length + (customGoal.trim() ? 1 : 0)} 项）
              </Button>
            </div>
          )}

          {/* 步骤1：联动控制追问 */}
          {showLinkageOptions && sceneConfig && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sceneConfig.linkageOptions.map((opt) => (
                <Button
                  key={opt}
                  variant="outline"
                  className="btn-press h-auto min-h-[48px] justify-start rounded-lg border-border px-4 py-3 text-left text-[14px] font-normal hover:border-primary hover:bg-primary/5 hover:text-primary"
                  onClick={() => handleSelectLinkage(opt)}
                >
                  <Send className="mr-2 h-4 w-4 shrink-0 text-primary" />
                  {opt}
                </Button>
              ))}
            </div>
          )}

          {/* 步骤2：部署环境单选 */}
          {showEnvOptions && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DEPLOY_ENV_OPTIONS.map((env) => (
                <Button
                  key={env}
                  variant="outline"
                  className="btn-press h-auto min-h-[48px] justify-start rounded-lg border-border px-4 py-3 text-left text-[14px] font-normal hover:border-primary hover:bg-primary/5 hover:text-primary"
                  onClick={() => handleSelectEnv(env)}
                >
                  {env}
                </Button>
              ))}
            </div>
          )}

          {/* 步骤3：技术约束（4问）*/}
          {showTechOptions && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TECH_QUESTIONS[techQuestionIdx]?.options.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className="btn-press h-auto min-h-[48px] justify-start whitespace-normal rounded-lg border-border px-4 py-3 text-left text-[14px] font-normal hover:border-primary hover:bg-primary/5 hover:text-primary"
                  onClick={() => handleGuidedAnswer(option)}
                >
                  <Send className="mr-2 h-4 w-4 shrink-0 text-primary" />
                  {option}
                </Button>
              ))}
            </div>
          )}

          {/* 自由/编辑模式：AI 返回选项 */}
          {showFreeOptions && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {freeOptions.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className="btn-press h-auto min-h-[48px] justify-start whitespace-normal rounded-lg border-border px-4 py-3 text-left text-[14px] font-normal hover:border-primary hover:bg-primary/5 hover:text-primary"
                  onClick={() => handleFreeOption(option)}
                >
                  <Send className="mr-2 h-4 w-4 shrink-0 text-primary" />
                  {option}
                </Button>
              ))}
            </div>
          )}

          {/* 自由/编辑模式：文字输入 */}
          {showInput && (
            <div className="flex gap-2">
              <Input
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder={mode === 'edit' ? '例如：预算砍到200，换成电池供电' : '请输入补充信息...'}
                className="h-11 flex-1 rounded-lg border-border bg-white text-[14px]"
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'edit' ? handleEditSubmit() : handleFreeSubmit())}
              />
              <Button
                onClick={mode === 'edit' ? handleEditSubmit : handleFreeSubmit}
                className="btn-press h-11 w-11 shrink-0 rounded-lg gradient-primary p-0 text-white shadow-md"
              >
                {mode === 'edit' ? <Wand2 className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          )}

          {/* 无效输入引导模式（free 模式专用） */}
          {mode === 'free' && guideMode && !loading && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {/* 蓝色渐变引导提示框 */}
              <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4 text-[13px] leading-relaxed text-foreground shadow-sm">
                <p className="mb-2 font-semibold text-[14px] text-primary">您好！我是 SensorMind，您的物联网硬件选型助手。</p>
                <p className="mb-3 text-muted-foreground">您的描述有点简单，为了给您生成精准的选型方案，请告诉我：</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li><span className="font-medium text-foreground">项目类型</span>：监测环境 / 控制设备 / 移动机器人 / 图像识别？</li>
                  <li><span className="font-medium text-foreground">核心功能</span>：想监测什么？或想控制什么动作？</li>
                  <li><span className="font-medium text-foreground">预算范围</span>：100元以内 / 100-300元 / 300-500元 / 不限？</li>
                  <li><span className="font-medium text-foreground">使用场景</span>：宿舍室内 / 户外大棚 / 实验室 / 工业现场？</li>
                </ol>
                <p className="mt-3 text-muted-foreground">例如：「宿舍温湿度监测系统，预算200元，数据传到手机」</p>
                {invalidCount >= 2 && (
                  <p className="mt-2 text-primary/80 font-medium">如果暂时没有具体想法，可以点击下方快捷选项或返回首页查看案例广场。</p>
                )}
              </div>

              {/* 重新输入框 */}
              <div className="flex gap-2">
                <Input
                  value={guideText}
                  onChange={(e) => setGuideText(e.target.value)}
                  placeholder="请补充您的项目需求..."
                  className="h-11 flex-1 rounded-lg border-primary/20 bg-white text-[14px] focus-visible:ring-primary/40"
                  onKeyDown={(e) => e.key === 'Enter' && handleGuideSubmit()}
                  autoFocus
                />
                <Button
                  onClick={handleGuideSubmit}
                  disabled={!guideText.trim()}
                  className="btn-press h-11 shrink-0 rounded-lg gradient-primary px-4 text-[13px] text-white shadow-md"
                >
                  生成方案
                </Button>
              </div>

              {/* 快捷选项 */}
              <div className="space-y-1.5">
                <p className="text-[12px] text-muted-foreground">如果不知道怎么说，试试：</p>
                <div className={`flex flex-wrap gap-2 ${invalidCount >= 2 ? 'gap-y-2' : ''}`}>
                  {['宿舍温湿度监测', '循迹避障小车', '自动浇花系统', '人体感应报警', '空气质量监测'].map((item) => (
                    <Button
                      key={item}
                      variant="outline"
                      className={`btn-press rounded-full border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 ${invalidCount >= 2 ? 'h-10 px-4 text-[14px]' : 'h-8 px-3 text-[12px]'}`}
                      onClick={() => handleQuickPick(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 返回入口 */}
              <p className="text-center text-[12px] text-muted-foreground">
                或者{' '}
                <a href="/" className="text-primary underline underline-offset-2 hover:text-primary/80">
                  返回首页查看案例广场 →
                </a>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── 约束博弈分析展示组件 ──
function ConflictBlock({ analysis }: { analysis: ConflictAnalysis }) {
  // ASCII 表格列宽（字符宽度，中文=2位）
  const cw = (s: string, w: number) => {
    let len = 0;
    for (const c of s) len += c.codePointAt(0)! > 127 ? 2 : 1;
    return s + ' '.repeat(Math.max(0, w - len));
  };
  const W = [8, 10, 12, 8]; // 约束项/用户要求/可行方案/代价 宽度
  const sep = '+' + W.map((w) => '-'.repeat(w + 2)).join('+') + '+';
  const hdr = '| ' + [cw('约束项', W[0]), cw('用户要求', W[1]), cw('可行方案', W[2]), cw('代价', W[3])].join(' | ') + ' |';
  const rows = analysis.rows.map((r) =>
    '| ' + [cw(r.constraint, W[0]), cw(r.userReq, W[1]), cw(r.feasible, W[2]), cw(r.cost, W[3])].join(' | ') + ' |'
  );
  const asciiTable = [sep, hdr, sep, ...rows, sep].join('\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-2 overflow-x-auto rounded-xl border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30"
    >
      {/* 标题栏 */}
      <div className="flex items-center gap-2 border-b border-orange-200 px-4 py-2 dark:border-orange-800">
        <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />
        <span className="text-[13px] font-semibold text-orange-700 dark:text-orange-400">约束博弈分析</span>
      </div>

      <div className="p-4">
        {/* ASCII 对比表 */}
        <pre className="mb-3 overflow-x-auto whitespace-pre font-mono text-[12px] leading-relaxed text-foreground">
          {asciiTable}
        </pre>

        {/* 冲突结论 */}
        {analysis.conclusion && (
          <p className="mb-3 text-[13px] font-medium text-orange-800 dark:text-orange-300">
            冲突结论：{analysis.conclusion}
          </p>
        )}

        {/* 优化路径 */}
        {analysis.paths.length > 0 && (
          <div>
            <p className="mb-1 text-[13px] font-semibold text-foreground">优化路径：</p>
            <div className="space-y-1">
              {analysis.paths.map((path) => (
                <div key={path.label} className="flex gap-2 text-[13px]">
                  <span className="shrink-0 font-bold text-primary">{path.label}.</span>
                  <span className="text-foreground">{path.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ChatPage;

