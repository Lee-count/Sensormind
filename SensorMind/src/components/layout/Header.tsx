import { Home, History } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const Header: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-primary">
            SensorMind
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={`gap-1 border-0 ${isHome ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
          >
            <Link to="/">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">首页</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={`gap-1 border-0 ${location.pathname === '/history' ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
          >
            <Link to="/history">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">我的方案</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
