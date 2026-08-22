import type { RouteConfig } from '@/types';
import HomePage from '@/pages/HomePage';
import ChatPage from '@/pages/ChatPage';
import ResultPage from '@/pages/ResultPage';
import CodePage from '@/pages/CodePage';
import HistoryPage from '@/pages/HistoryPage';
import ComparePage from '@/pages/ComparePage';
import ShowcasePage from '@/pages/ShowcasePage';
import ShareCardPage from '@/pages/ShareCardPage';
import PlanDetailPage from '@/pages/PlanDetailPage';
import NotFound from '@/pages/NotFound';

export const routes: RouteConfig[] = [
  { name: '首页',   path: '/',              element: <HomePage />,     public: true },
  { name: 'AI 对话', path: '/chat',          element: <ChatPage />,     public: true },
  { name: '方案结果', path: '/result',        element: <ResultPage />,   public: true },
  { name: '代码建议', path: '/code',          element: <CodePage />,     public: true },
  { name: '我的方案', path: '/history',       element: <HistoryPage />,  public: true },
  { name: '方案详情', path: '/plan/:id',     element: <PlanDetailPage />, public: true },
  { name: '方案对比', path: '/compare',       element: <ComparePage />,  public: true },
  { name: '案例广场', path: '/showcase/:id',  element: <ShowcasePage />, public: true },
  { name: '分享卡片', path: '/share-card',     element: <ShareCardPage />, public: true },
  { name: '404',    path: '*',              element: <NotFound />,     public: true },
];
