import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { SelectionProvider } from '@/contexts/SelectionContext';

import { routes } from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <SelectionProvider>
        <IntersectObserver />
        <div className="flex flex-col min-h-screen bg-background">
          <main className="flex-1 min-w-0">
            <Routes>
              {routes.map((route, index) => (
                <Route key={index} path={route.path} element={route.element} />
              ))}
            </Routes>
          </main>
        </div>
        <Toaster />
      </SelectionProvider>
    </Router>
  );
};

export default App;
