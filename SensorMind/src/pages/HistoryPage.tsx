import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Calendar, ChevronRight, Package, Edit2, Wand2, Save, X, Trash2, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { fetchPlans, updatePlanName, deletePlan } from '@/services/plans';
import { useSelection } from '@/contexts/SelectionContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import type { Plan } from '@/types';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { setPlan, setScene, setMode, setFreeInput, setBaseConstraints } = useSelection();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // 对比选中集合，最多3个
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = () => {
    setLoading(true);
    fetchPlans()
      .then((data) => setPlans(data))
      .catch((error) => toast.error(error instanceof Error ? error.message : '加载历史方案失败'))
      .finally(() => setLoading(false));
  };

  const handleEdit = (plan: Plan) => { setEditingId(plan.id); setEditingName(plan.planName || plan.sceneName); };

  const handleSaveName = async (plan: Plan) => {
    if (!editingName.trim()) { toast.error('方案名称不能为空'); return; }
    try {
      await updatePlanName(plan.id, editingName.trim());
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, planName: editingName.trim() } : p)));
      setEditingId(null);
      toast.success('方案名称已更新');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败');
    }
  };

  const handleDelete = async (id: string, planName: string) => {
    setDeletingId(id);
    try {
      await deletePlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      setCompareIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast.success(`方案「${planName}」已删除`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditBasedOn = (plan: Plan) => {
    setPlan(null);
    setScene({ id: plan.sceneName, name: plan.sceneName, icon: Package, description: '' });
    setMode('edit');
    setFreeInput('');
    setBaseConstraints({ budget: plan.budget, precision: plan.precisionRequirement, communication: plan.communication, power: plan.powerSupply });
    navigate('/chat');
  };

  // 切换对比选中状态
  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) { s.delete(id); return s; }
      if (s.size >= 3) { toast.error('最多同时对比3个方案'); return s; }
      s.add(id);
      return s;
    });
  };

  // 跳转对比页，把选中方案 id 通过 state 传递
  const handleGoCompare = () => {
    const selected = plans.filter((p) => compareIds.has(p.id));
    navigate('/compare', { state: { plans: selected } });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex min-h-screen flex-col page-bg">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-6 flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-[24px] font-bold text-foreground">我的方案</h1>
              <p className="text-[12px] text-muted-foreground">共 {plans.length} 个方案</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[14px] text-muted-foreground">加载中...</div>
          ) : plans.length === 0 ? (
            <Card className="panel-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-[14px] font-medium text-muted-foreground">暂无保存的方案</p>
                <p className="mt-1 text-[12px] text-muted-foreground">快去首页生成一个吧</p>
                <Button onClick={() => navigate('/')} className="btn-press mt-4 h-12 gap-1 rounded-lg gradient-primary px-6 text-[16px] font-medium text-white shadow-primary">
                  去首页选型
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => {
                const isChecked = compareIds.has(plan.id);
                return (
                  <Card
                    key={plan.id}
                    className={`scene-card rounded-[12px] border bg-card shadow-card transition-colors ${
                      isChecked ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleCompare(plan.id); }}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            isChecked
                              ? 'border-primary bg-primary text-white'
                              : 'border-border bg-background hover:border-primary'
                          }`}
                          aria-label={isChecked ? '取消选择对比' : '选择对比'}
                        >
                          {isChecked && (
                            <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-white stroke-2">
                              <polyline points="1,5 4.5,9 11,1" />
                            </svg>
                          )}
                        </button>

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Package className="h-5 w-5" />
                        </div>
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => navigate(`/plan/${plan.id}`)}
                        >
                          {editingId === plan.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="h-8 rounded-lg border-border bg-muted text-[13px]"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName(plan)}
                              />
                              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => handleSaveName(plan)}>
                                <Save className="h-4 w-4 text-primary" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setEditingId(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <h3 className="truncate text-[16px] font-bold text-foreground">{plan.planName || plan.sceneName}</h3>
                              <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); handleEdit(plan); }}>
                                <Edit2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[12px] text-primary">{plan.sceneName}</span>
                            <span className="text-[12px] text-muted-foreground">{plan.budget}</span>
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(plan.createdAt)}
                          </p>
                        </div>
                        <div
                          className="shrink-0 cursor-pointer text-right"
                          onClick={() => navigate(`/plan/${plan.id}`)}
                        >
                          <p className="text-[18px] font-bold text-primary">¥{plan.totalCost.toFixed(0)}</p>
                          <ChevronRight className="ml-auto mt-1 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                        <Button variant="outline" size="sm" className="btn-press gap-1 rounded-lg text-[13px]" onClick={() => handleEditBasedOn(plan)}>
                          <Wand2 className="h-4 w-4" />
                          基于此修改
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="btn-press gap-1 rounded-lg text-[13px] text-destructive hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                              删除
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除方案「{plan.planName || plan.sceneName}」吗？此操作不可恢复。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-lg">取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(plan.id, plan.planName || plan.sceneName)}
                                disabled={deletingId === plan.id}
                                className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deletingId === plan.id ? '删除中...' : '确定删除'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>

      {/* 底部固定对比栏 */}
      <AnimatePresence>
        {compareIds.size >= 2 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 px-4 py-3 backdrop-blur-sm"
          >
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <p className="text-[13px] text-muted-foreground">
                已选 <span className="font-semibold text-primary">{compareIds.size}</span> 个方案（最多3个）
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-[13px]"
                  onClick={() => setCompareIds(new Set())}
                >
                  清空选择
                </Button>
                <Button
                  size="sm"
                  className="btn-press gap-1 rounded-lg gradient-primary text-white shadow-primary text-[13px]"
                  onClick={handleGoCompare}
                >
                  <GitCompare className="h-4 w-4" />
                  对比选中方案
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoryPage;
