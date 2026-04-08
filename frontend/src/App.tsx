// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AdminProvider } from './contexts/AdminContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Library from './pages/Library';
import Upload from './pages/Upload';
import AdminAnalytics from './pages/AdminAnalytics';

// Layout wrapper that includes Navbar and Footer
function DepartmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AdminProvider>
      <Router>
        <Analytics />
        <Routes>
          {/* Home page — department selection (no navbar needed, it has its own layout) */}
          <Route path="/" element={
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Navbar />
              <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Home />
              </main>
              <Footer />
            </div>
          } />

          {/* Department Library */}
          <Route path="/:department/library" element={
            <DepartmentLayout>
              <Library />
            </DepartmentLayout>
          } />

          {/* Department Upload */}
          <Route path="/:department/upload" element={
            <DepartmentLayout>
              <Upload />
            </DepartmentLayout>
          } />

          {/* Admin Analytics */}
          <Route path="/admin/analytics" element={
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Navbar />
              <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <AdminAnalytics />
              </main>
              <Footer />
            </div>
          } />
        </Routes>
      </Router>
    </AdminProvider>
  );
}

export default App;