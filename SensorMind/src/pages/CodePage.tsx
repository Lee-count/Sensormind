import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSelection } from '@/contexts/SelectionContext';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';

const CodePage: React.FC = () => {
  const navigate = useNavigate();
  const { plan, scene } = useSelection();

  useEffect(() => {
    if (!plan || !scene) {
      navigate('/', { replace: true });
    }
  }, [plan, scene, navigate]);

  if (!plan || !scene) return null;

  const code = plan.codeSuggestion;

  const copyCode = () => {
    navigator.clipboard.writeText(code.initCode).then(() => {
      toast.success('代码已复制到剪贴板');
    });
  };

  return (
    <div className="flex min-h-screen flex-col page-bg">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-bold md:text-2xl">代码建议</h1>
              <p className="text-sm text-muted-foreground">{plan.sceneName} · {code.framework === 'arduino' ? 'Arduino' : 'MicroPython'} 初始化框架</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/result')} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              返回方案
            </Button>
          </div>

          <Card className="mb-6 border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">推荐库</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {code.libraries.map((lib, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {lib}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">引脚定义建议</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {code.pinDefinitions.map((pin, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {pin}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">初始化代码</CardTitle>
              <Button variant="ghost" size="sm" onClick={copyCode} className="gap-1">
                <Copy className="h-4 w-4" />
                复制
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto rounded-lg bg-muted p-4">
                <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-foreground">
                  {code.initCode || '暂无代码建议'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default CodePage;
