import { useEffect, useState } from 'react';
import { supabase, Video, Program, TestingCenter } from '../../lib/supabase';
import { Search, Filter, Calendar, MapPin, Play } from 'lucide-react';

interface VideoListProps {
  onVideoSelect: (video: Video) => void;
}

export function VideoList({ onVideoSelect }: VideoListProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [centers, setCenters] = useState<TestingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [videosResult, programsResult, centersResult] = await Promise.all([
        supabase
          .from('videos')
          .select('*, program:programs(*), testing_center:testing_centers(*)')
          .order('created_at', { ascending: false }),
        supabase.from('programs').select('*').order('name'),
        supabase.from('testing_centers').select('*').order('name'),
      ]);

      if (videosResult.data) setVideos(videosResult.data);
      if (programsResult.data) setPrograms(programsResult.data);
      if (centersResult.data) setCenters(centersResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.program?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.testing_center?.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProgram = !filterProgram || video.program_id === filterProgram;
    const matchesCenter = !filterCenter || video.testing_center_id === filterCenter;
    const matchesStatus = !filterStatus || video.status === filterStatus;

    return matchesSearch && matchesProgram && matchesCenter && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Videos</h1>
        <p className="text-slate-600 mt-2">Browse and search test session recordings</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by session ID, program, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors inline-flex items-center"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Program</label>
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Programs</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Testing Center</label>
              <select
                value={filterCenter}
                onChange={(e) => setFilterCenter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Centers</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="processing">Processing</option>
                <option value="ready">Ready</option>
                <option value="flagged">Flagged</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {filteredVideos.length} {filteredVideos.length === 1 ? 'Video' : 'Videos'}
          </h2>
        </div>
        <div className="divide-y divide-slate-200">
          {filteredVideos.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              No videos found matching your criteria
            </div>
          ) : (
            filteredVideos.map((video) => (
              <div
                key={video.id}
                className="px-6 py-5 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => onVideoSelect(video)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{video.session_id}</h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          video.status === 'flagged'
                            ? 'bg-red-100 text-red-700'
                            : video.status === 'reviewed'
                            ? 'bg-green-100 text-green-700'
                            : video.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {video.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                      <div className="flex items-center">
                        <Play className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{video.program?.name}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{video.testing_center?.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{new Date(video.test_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">
                          Duration: {Math.floor(video.duration_seconds / 60)}m {video.duration_seconds % 60}s
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <div className="text-2xl font-bold text-red-600">{video.total_violations}</div>
                    <div className="text-sm text-slate-600">violations detected</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {video.reviewed_violations} reviewed
                    </div>
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
