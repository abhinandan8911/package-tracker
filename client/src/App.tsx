import { Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { PackageDetailPage } from './pages/PackageDetailPage';
import { ChatPanel } from './components/chat/ChatPanel';

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/packages/:id" element={<PackageDetailPage />} />
        </Routes>
      </main>
      <ChatPanel />
    </div>
  );
}
