'use client';

import { useState } from 'react';

interface SocialMediaUploadProps {
  mediaBlob: Blob;
  mediaType: 'image' | 'video';
  fileName: string;
}

const PLATFORMS = [
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: '𝕏',
    color: 'bg-black hover:bg-gray-900',
    shareUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    supportsDirectUpload: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    shareUrl: () => 'https://www.instagram.com/',
    supportsDirectUpload: false,
    note: 'Save file then upload via the Instagram app',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '𝑓',
    color: 'bg-blue-700 hover:bg-blue-800',
    shareUrl: (text: string, url?: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url ?? '')}`,
    supportsDirectUpload: false,
    note: 'Save file then share on Facebook',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '♪',
    color: 'bg-[#010101] hover:bg-gray-900 border border-gray-700',
    shareUrl: () => 'https://www.tiktok.com/upload',
    supportsDirectUpload: false,
    note: 'Save file then upload via TikTok',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '👽',
    color: 'bg-orange-600 hover:bg-orange-700',
    shareUrl: (text: string) => `https://reddit.com/submit?title=${encodeURIComponent(text)}`,
    supportsDirectUpload: false,
    note: 'Save file then share on Reddit',
  },
];

export default function SocialMediaUpload({ mediaBlob, mediaType, fileName }: SocialMediaUploadProps) {
  const [caption, setCaption] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  const downloadFile = () => {
    const url = URL.createObjectURL(mediaBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadTriggered(true);
  };

  const copyCaption = async () => {
    if (caption) {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openPlatform = (platform: typeof PLATFORMS[0]) => {
    if (!downloadTriggered) downloadFile();
    window.open(platform.shareUrl(caption), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4 space-y-3">
        <h3 className="text-white font-semibold text-sm">Share to Social Media</h3>

        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-medium">Caption / Description</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="flex-1 bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
            />
            {caption && (
              <button
                onClick={copyCaption}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg border border-gray-600 transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => openPlatform(platform)}
              className={`${platform.color} text-white text-sm font-medium py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2`}
              title={platform.note}
            >
              <span>{platform.icon}</span>
              <span>{platform.name}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-3">
          <button
            onClick={downloadFile}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>⬇</span>
            <span>Download Privacy-Protected {mediaType === 'image' ? 'Image' : 'Video'}</span>
          </button>
          {downloadTriggered && (
            <p className="text-xs text-green-400 mt-2 text-center">
              File saved! Now use any platform button above to upload it.
            </p>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
        <p className="text-xs text-gray-400">
          <span className="text-yellow-400 font-medium">Privacy note:</span>{' '}
          Faces are censored and metadata has been stripped. For platforms that compress media
          (Instagram, TikTok), some metadata may be re-added by the platform itself — the
          face censoring will remain intact.
        </p>
      </div>
    </div>
  );
}
