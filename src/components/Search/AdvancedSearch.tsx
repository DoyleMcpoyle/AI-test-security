import { useState, useEffect } from 'react';
import { supabase, Video, Violation, ViolationType, Program, TestingCenter } from '../../lib/supabase';
import { Search, Calendar, MapPin, AlertTriangle, Clock } from 'lucide-react';

export function AdvancedSearch() {
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [centers, setCenters] = useState<TestingCenter[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    keyword: '',
    startDate: '',
    endDate: '',
    programId: '',
    centerId: '',
    violationType: '',
    minConfidence: 70,
    status: '',
  });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    const [violationTypesResult, programsResult, centersResult] = await Promise.all([
      supabase.from('violation_types').select('*').order('name'),
      supabase.from('programs').select('*').order('name'),
      supabase.from('testing_centers').select('*').order('name'),
    ]);

    if (violationTypesResult.data) setViolationTypes(violationTypesResult.data);
    if (programsResult.data) setPrograms(programsResult.data);
    if (centersResult.data) setCenters(centersResult.data);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('videos')
        .select('*, program:programs(*), testing_center:testing_centers(*)');

      if (filters.programId) {
        query = query.eq('program_id', filters.programId);
      }

      if (filters.centerId) {
        query = query.eq('testing_center_id', filters.centerId);
      }

      if (filters.startDate) {
        query = query.gte('test_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('test_date', filters.endDate);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data: videosData } = await query.order('test_date', { ascending: false });

      if (videosData) {
        let filteredVideos = videosData;

        if (filters.violationType || filters.minConfidence) {
          const videoIds = videosData.map((v) => v.id);
          let violationsQuery = supabase
            .from('violations')
            .select('video_id, violation_type_id, confidence_score')
            .in('video_id', videoIds);

          if (filters.violationType) {
            violationsQuery = violationsQuery.eq('violation_type_id', filters.violationType);
          }

          if (filters.minConfidence) {
            violationsQuery = violationsQuery.gte('confidence_score', filters.minConfidence / 100);
          }

          const { data: violationsData } = await violationsQuery;

          if (violationsData) {
            const videoIdsWithViolations = new Set(violationsData.map((v) => v.video_id));
            filteredVideos = videosData.filter((v) => videoIdsWithViolations.has(v.id));
          }
        }

        if (filters.keyword) {
          filteredVideos = filteredVideos.filter(
            (v) =>
              v.session_id.toLowerCase().includes(filters.keyword.toLowerCase()) ||
              v.program?.name.toLowerCase().includes(filters.keyword.toLowerCase()) ||
              v.testing_center?.location.toLowerCase().includes(filters.keyword.toLowerCase())
          );
        }

        setSearchResults(filteredVideos);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Advanced Search</h1>
        <p className="text-slate-600 mt-2">Search videos by multiple criteria and violation types</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-slate-700 mb-2">Keyword Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="Search by session ID, program, or location..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Program</label>
            <select
              value={filters.programId}
              onChange={(e) => setFilters({ ...filters, programId: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              value={filters.centerId}
              onChange={(e) => setFilters({ ...filters, centerId: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Centers</option>
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name} - {center.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Violation Type</label>
            <select
              value={filters.violationType}
              onChange={(e) => setFilters({ ...filters, violationType: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {violationTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Min Confidence: {filters.minConfidence}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minConfidence}
              onChange={(e) => setFilters({ ...filters, minConfidence: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="processing">Processing</option>
              <option value="ready">Ready</option>
              <option value="flagged">Flagged</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? 'Searching...' : 'Search Videos'}
            </button>
          </div>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Search Results ({searchResults.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            {searchResults.map((video) => (
              <div key={video.id} className="px-6 py-5 hover:bg-slate-50 transition-colors">
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
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {video.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600">
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-slate-400" />
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
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <div className="text-2xl font-bold text-red-600">{video.total_violations}</div>
                    <div className="text-sm text-slate-600">violations</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && searchResults.length === 0 && filters.keyword === '' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Search className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600">Configure your search criteria and click "Search Videos"</p>
        </div>
      )}

      {!loading && searchResults.length === 0 && filters.keyword !== '' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Search className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600">No videos found matching your search criteria</p>
        </div>
      )}
    </div>
  );
}
