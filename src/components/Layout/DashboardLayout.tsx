import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Video, Search, Users, Settings, LogOut, Shield } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function DashboardLayout({ children, currentView, onViewChange }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Shield },
    { id: 'videos', name: 'Videos', icon: Video },
    { id: 'search', name: 'Search', icon: Search },
    { id: 'users', name: 'Users', icon: Users, adminOnly: true },
  ];

  const visibleNavigation = navigation.filter(
    (item) => !item.adminOnly || profile?.role === 'admin'
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Shield className="w-8 h-8 text-blue-600" />
                <span className="ml-3 text-xl font-bold text-slate-900">AI CCTV</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {visibleNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        currentView === item.id
                          ? 'border-blue-500 text-slate-900'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{profile?.full_name}</p>
                <p className="text-xs text-slate-500 capitalize">
                  {profile?.role.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                onClick={signOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
