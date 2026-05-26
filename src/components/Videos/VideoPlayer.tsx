import { useEffect, useState, useRef } from 'react';
import { supabase, Video, Violation, ViolationType, Adjudication } from '../../lib/supabase';
import { ArrowLeft, AlertTriangle, Check, X, Flag, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface VideoPlayerProps {
  video: Video;
  onBack: () => void;
}

export function VideoPlayer({ video, onBack }: VideoPlayerProps) {
  const { profile } = useAuth();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [adjudications, setAdjudications] = useState<Record<string, Adjudication>>({});
  const [loading, setLoading] = useState(true);
  const [adjudicating, setAdjudicating] = useState(false);
  const [notes, setNotes] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadViolations();
  }, [video.id]);

  const loadViolations = async () => {
    try {
      const { data: violationsData } = await supabase
        .from('violations')
        .select('*, violation_type:violation_types(*)')
        .eq('video_id', video.id)
        .order('timestamp_seconds');

      if (violationsData) {
        setViolations(violationsData);

        const { data: adjudicationsData } = await supabase
          .from('adjudications')
          .select('*')
          .in('violation_id', violationsData.map((v) => v.id));

        if (adjudicationsData) {
          const adjMap: Record<string, Adjudication> = {};
          adjudicationsData.forEach((adj) => {
            adjMap[adj.violation_id] = adj;
          });
          setAdjudications(adjMap);
        }
      }
    } catch (error) {
      console.error('Error loading violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const jumpToTimestamp = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  const handleAdjudicate = async (decision: 'confirmed' | 'rejected' | 'escalated') => {
    if (!selectedViolation || !profile) return;

    setAdjudicating(true);
    try {
      const { data, error } = await supabase
        .from('adjudications')
        .insert({
          violation_id: selectedViolation.id,
          reviewer_id: profile.id,
          decision,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('violations')
        .update({ status: decision === 'confirmed' ? 'confirmed' : 'rejected' })
        .eq('id', selectedViolation.id);

      setAdjudications((prev) => ({
        ...prev,
        [selectedViolation.id]: data,
      }));

      setViolations((prev) =>
        prev.map((v) =>
          v.id === selectedViolation.id
            ? { ...v, status: decision === 'confirmed' ? 'confirmed' : 'rejected' }
            : v
        )
      );

      setNotes('');
      setSelectedViolation(null);
    } catch (error) {
      console.error('Error adjudicating violation:', error);
      alert('Failed to submit adjudication');
    } finally {
      setAdjudicating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Videos
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">{video.session_id}</h1>
          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
            <span>{video.program?.name}</span>
            <span>•</span>
            <span>{video.testing_center?.location}</span>
            <span>•</span>
            <span>{new Date(video.test_date).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
          <div className="text-center text-white">
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              poster="https://via.placeholder.com/1280x720/1e293b/ffffff?text=Video+Player"
            >
              <source src={video.video_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Detected Violations ({violations.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
            {violations.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500">No violations detected</div>
            ) : (
              violations.map((violation) => {
                const adjudication = adjudications[violation.id];
                return (
                  <div
                    key={violation.id}
                    className={`px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedViolation?.id === violation.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedViolation(violation)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full border ${getSeverityColor(
                              violation.violation_type?.severity || 'medium'
                            )}`}
                          >
                            {violation.violation_type?.name}
                          </span>
                          {adjudication && (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                adjudication.decision === 'confirmed'
                                  ? 'bg-green-100 text-green-700'
                                  : adjudication.decision === 'rejected'
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {adjudication.decision}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {violation.violation_type?.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(violation.timestamp_seconds)}
                          </span>
                          <span>Confidence: {(violation.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          jumpToTimestamp(violation.timestamp_seconds);
                        }}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Jump to Time
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Adjudication</h2>
          </div>
          <div className="p-6">
            {!selectedViolation ? (
              <div className="text-center text-slate-500 py-8">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p>Select a violation to review</p>
              </div>
            ) : adjudications[selectedViolation.id] ? (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-700 mb-1">Decision</p>
                  <p className="text-lg font-semibold text-slate-900 capitalize">
                    {adjudications[selectedViolation.id].decision}
                  </p>
                </div>
                {adjudications[selectedViolation.id].notes && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-700 mb-1">Notes</p>
                    <p className="text-sm text-slate-900">{adjudications[selectedViolation.id].notes}</p>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-700 mb-1">Reviewed At</p>
                  <p className="text-sm text-slate-900">
                    {new Date(adjudications[selectedViolation.id].reviewed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any additional notes about this violation..."
                  />
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleAdjudicate('confirmed')}
                    disabled={adjudicating}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Confirm Violation
                  </button>
                  <button
                    onClick={() => handleAdjudicate('rejected')}
                    disabled={adjudicating}
                    className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Reject Violation
                  </button>
                  <button
                    onClick={() => handleAdjudicate('escalated')}
                    disabled={adjudicating}
                    className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    <Flag className="w-5 h-5 mr-2" />
                    Escalate for Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
