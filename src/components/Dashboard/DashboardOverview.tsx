import { useEffect, useState } from 'react';
import { supabase, Video, Violation } from '../../lib/supabase';
import { AlertTriangle, Video as VideoIcon, CheckCircle, Clock } from 'lucide-react';

interface Stats {
  totalVideos: number;
  flaggedVideos: number;
  pendingReviews: number;
  confirmedViolations: number;
}

export function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    totalVideos: 0,
    flaggedVideos: 0,
    pendingReviews: 0,
    confirmedViolations: 0,
  });
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [videosResult, violationsResult, recentResult] = await Promise.all([
        supabase.from('videos').select('status'),
        supabase.from('violations').select('status'),
        supabase
          .from('videos')
          .select('*, program:programs(*), testing_center:testing_centers(*)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (videosResult.data) {
        const flagged = videosResult.data.filter((v) => v.status === 'flagged').length;
        setStats((prev) => ({
          ...prev,
          totalVideos: videosResult.data.length,
          flaggedVideos: flagged,
        }));
      }

      if (violationsResult.data) {
        const pending = violationsResult.data.filter((v) => v.status === 'pending').length;
        const confirmed = violationsResult.data.filter((v) => v.status === 'confirmed').length;
        setStats((prev) => ({
          ...prev,
          pendingReviews: pending,
          confirmedViolations: confirmed,
        }));
      }

      if (recentResult.data) {
        setRecentVideos(recentResult.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Videos',
      value: stats.totalVideos,
      icon: VideoIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Flagged Videos',
      value: stats.flaggedVideos,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingReviews,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Confirmed Violations',
      value: stats.confirmedViolations,
      icon: CheckCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Overview of test security monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Videos</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {recentVideos.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">No videos found</div>
          ) : (
            recentVideos.map((video) => (
              <div key={video.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-slate-900">{video.session_id}</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          video.status === 'flagged'
                            ? 'bg-red-100 text-red-700'
                            : video.status === 'reviewed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {video.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                      <span>{video.program?.name}</span>
                      <span>•</span>
                      <span>{video.testing_center?.location}</span>
                      <span>•</span>
                      <span>{new Date(video.test_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {video.total_violations} violations
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {video.reviewed_violations} reviewed
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
