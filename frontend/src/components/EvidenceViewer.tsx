import { useState } from 'react';
import type { EvidenceFile } from '../types';

export default function EvidenceViewer({ files }: { files: EvidenceFile[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const images = files.filter((f) => f.mime_type.startsWith('image/'));
  const videos = files.filter((f) => f.mime_type.startsWith('video/'));

  if (images.length === 0 && videos.length === 0) {
    return <div className="text-gray-400 text-sm">暂无证据文件</div>;
  }

  const allMedia = [...images, ...videos];

  return (
    <div>
      <div className="flex gap-2 mb-2 flex-wrap">
        {images.map((img, i) => (
          <button
            key={img.id}
            className={`px-3 py-1 text-xs rounded ${activeIdx === i ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveIdx(i)}
          >
            {img.evidence_type}
          </button>
        ))}
        {videos.map((vid, i) => (
          <button
            key={vid.id}
            className={`px-3 py-1 text-xs rounded ${activeIdx === images.length + i ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveIdx(images.length + i)}
          >
            视频片段
          </button>
        ))}
      </div>
      <div className="bg-black rounded overflow-hidden flex items-center justify-center min-h-[300px]">
        {activeIdx < images.length ? (
          <img
            src={images[activeIdx].url}
            alt={images[activeIdx].evidence_type}
            className="max-w-full max-h-[500px] object-contain"
          />
        ) : (
          <video
            controls
            className="max-w-full max-h-[500px]"
            src={videos[activeIdx - images.length]?.url}
          />
        )}
      </div>
    </div>
  );
}
