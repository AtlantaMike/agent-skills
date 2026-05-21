'use client';

import type { ProcessingConfig, MetadataConfig, CensorMode } from '@/types';

interface SettingsPanelProps {
  config: ProcessingConfig;
  metaConfig: MetadataConfig;
  onConfigChange: (c: ProcessingConfig) => void;
  onMetaChange: (c: MetadataConfig) => void;
}

export default function SettingsPanel({ config, metaConfig, onConfigChange, onMetaChange }: SettingsPanelProps) {
  const update = <K extends keyof ProcessingConfig>(key: K, value: ProcessingConfig[K]) =>
    onConfigChange({ ...config, [key]: value });

  const updateMeta = <K extends keyof MetadataConfig>(key: K, value: MetadataConfig[K]) =>
    onMetaChange({ ...metaConfig, [key]: value });

  return (
    <div className="space-y-5">
      {/* Censor Effect */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Censor Effect</h3>
        <div className="grid grid-cols-3 gap-2">
          {(['blur', 'pixelate', 'black'] as CensorMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => update('censorMode', mode)}
              className={`py-2 px-3 rounded-lg text-sm font-medium capitalize border transition-colors ${
                config.censorMode === mode
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {config.censorMode === 'blur' && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Blur strength</span>
              <span>{config.blurRadius}px</span>
            </div>
            <input
              type="range"
              min={8}
              max={80}
              value={config.blurRadius}
              onChange={(e) => update('blurRadius', +e.target.value)}
              className="w-full accent-red-500"
            />
          </div>
        )}

        {config.censorMode === 'pixelate' && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Pixel size</span>
              <span>{config.pixelSize}px</span>
            </div>
            <input
              type="range"
              min={4}
              max={40}
              value={config.pixelSize}
              onChange={(e) => update('pixelSize', +e.target.value)}
              className="w-full accent-red-500"
            />
          </div>
        )}
      </div>

      {/* Face Detection */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Detection Settings</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Face padding</span>
              <span>{Math.round(config.expandFactor * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.6}
              step={0.05}
              value={config.expandFactor}
              onChange={(e) => update('expandFactor', +e.target.value)}
              className="w-full accent-red-500"
            />
            <p className="text-xs text-gray-500">Extra padding around detected face region</p>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Metadata & Anonymity</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={metaConfig.stripAll}
              onChange={(e) => updateMeta('stripAll', e.target.checked)}
              className="accent-red-500 w-4 h-4"
            />
            <div>
              <span className="text-sm text-white">Strip ALL metadata</span>
              <p className="text-xs text-gray-500">Remove every EXIF tag (recommended)</p>
            </div>
          </label>

          {!metaConfig.stripAll && (
            <>
              <label className="flex items-center gap-3 cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={metaConfig.fakeDevice}
                  onChange={(e) => updateMeta('fakeDevice', e.target.checked)}
                  className="accent-red-500 w-4 h-4"
                />
                <div>
                  <span className="text-sm text-gray-200">Spoof device info</span>
                  <p className="text-xs text-gray-500">Replace make/model with random phone</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={metaConfig.fakeTimestamp}
                  onChange={(e) => updateMeta('fakeTimestamp', e.target.checked)}
                  className="accent-red-500 w-4 h-4"
                />
                <div>
                  <span className="text-sm text-gray-200">Randomize timestamp</span>
                  <p className="text-xs text-gray-500">Replace capture time with a random recent date</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={metaConfig.fakeGPS}
                  onChange={(e) => updateMeta('fakeGPS', e.target.checked)}
                  className="accent-red-500 w-4 h-4"
                />
                <div>
                  <span className="text-sm text-gray-200">Fake GPS location</span>
                  <p className="text-xs text-gray-500">Replace GPS with random world city</p>
                </div>
              </label>
            </>
          )}

          <div className="mt-2">
            <label className="text-xs text-gray-400">Custom comment (optional)</label>
            <input
              type="text"
              value={metaConfig.customComment ?? ''}
              onChange={(e) => updateMeta('customComment', e.target.value || undefined)}
              placeholder="Leave blank for none"
              className="mt-1 w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
