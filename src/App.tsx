import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { VideoList } from './components/Videos/VideoList';
import { VideoPlayer } from './components/Videos/VideoPlayer';
import { AdvancedSearch } from './components/Search/AdvancedSearch';
import { UserManagement } from './components/Users/UserManagement';
import { Video } from './lib/supabase';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginForm />;
  }

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleBackToVideos = () => {
    setSelectedVideo(null);
  };

  const renderContent = () => {
    if (selectedVideo) {
      return <VideoPlayer video={selectedVideo} onBack={handleBackToVideos} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'videos':
        return <VideoList onVideoSelect={handleVideoSelect} />;
      case 'search':
        return <AdvancedSearch />;
      case 'users':
        return <UserManagement />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout currentView={currentView} onViewChange={setCurrentView}>
      {renderContent()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
