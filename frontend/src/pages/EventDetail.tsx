import { useParams, useNavigate } from 'react-router-dom';
import { useEventDetail } from '../hooks/useEventDetail';
import { useReview } from '../hooks/useReview';
import StatusBadge from '../components/StatusBadge';
import EvidenceViewer from '../components/EvidenceViewer';
import ReviewPanel from '../components/ReviewPanel';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useEventDetail(id!);
  const { submit, submitting } = useReview(id!);

  if (loading) return <div className="text-gray-400">加载中...</div>;
  if (error && error.includes('404')) {
    return (
      <EmptyState
        icon="⚠️"
        title="事件不存在"
        description="该事件可能已被删除，或 ID 不正确"
        action={{ label: "返回事件列表", onClick: () => navigate('/events') }}
      />
    );
  }
  if (error) return <ErrorBanner message={`加载事件失败: ${error}`} />;
  if (!data) return null;

  const handleReview = async (status: string, note: string): Promise<boolean> => {
    const ok = await submit(status, note);
    if (ok) refetch();
    return ok;
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">事件详情</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4 space-y-2 text-sm">
          <div><span className="text-gray-500">事件 ID:</span> <span className="font-mono">{data.event_id}</span></div>
          <div><span className="text-gray-500">设备:</span> {data.device_id}</div>
          <div><span className="text-gray-500">开始时间:</span> {data.start_time}</div>
          <div><span className="text-gray-500">结束时间:</span> {data.end_time}</div>
          <div><span className="text-gray-500">持续时长:</span> {data.duration_seconds}秒</div>
          <div><span className="text-gray-500">轨迹 ID:</span> {data.track_id}</div>
          <div><span className="text-gray-500">车辆类别:</span> {data.vehicle_class}</div>
          <div><span className="text-gray-500">置信度:</span> {(data.confidence * 100).toFixed(0)}%</div>
          <div>
            <span className="text-gray-500">GPS:</span>{' '}
            {data.gps_location
              ? `${data.gps_location.lat.toFixed(4)}, ${data.gps_location.lng.toFixed(4)}`
              : '无'}
          </div>
          <div><span className="text-gray-500">状态:</span> <StatusBadge status={data.review_status} /></div>
        </div>
        <ReviewPanel
          reviewStatus={data.review_status}
          operatorNote={data.operator_note}
          onSubmit={handleReview}
          submitting={submitting}
        />
      </div>
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">证据文件</h2>
        {data.evidence_files.length === 0 && (
          <div className="text-gray-400 text-sm p-4 border border-dashed border-gray-300 rounded">
            暂无证据文件 — 该事件可能尚未完成证据上传
          </div>
        )}
        <EvidenceViewer files={data.evidence_files} />
      </div>
    </div>
  );
}
