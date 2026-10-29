import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomeView } from './views/HomeView';
import { PosView } from './views/pos/PosView';
import { ProductsView } from './views/ProductsView';
import { CustomersView } from './views/CustomersView';
import { OrdersView } from './views/OrdersView';
import { PriceListsView } from './views/PriceListsView';
import { BackupsView } from './views/BackupsView';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  React.useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.focus();
  }, [currentView]);

  const renderView = () => {
    switch (currentView) {
      case 'pos': return <PosView />;
      case 'products': return <ProductsView />;
      case 'customers': return <CustomersView />;
      case 'orders': return <OrdersView />;
      case 'lists': return <PriceListsView />;
      case 'backups': return <BackupsView />;
      case 'home':
      default:
        return <HomeView onNavigate={(v) => setCurrentView(v)} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="main-wrapper">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} currentView={currentView} />
        <main className="page-container">
          <ErrorBoundary onResetView={() => setCurrentView('home')}>
            {renderView()}
          </ErrorBoundary>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

