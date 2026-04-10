import { useState } from 'react';
import { Key, X } from 'lucide-react';
import { getApiKey, setApiKey } from './claude';

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const [key, setKey] = useState(getApiKey());
  const [saved, setSaved] = useState(false);

  const save = () => {
    setApiKey(key.trim());
    setSaved(true);
    setTimeout(onClose, 700);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1e1e2e', border: '1px solid #2d2d3f', borderRadius: 12,
          padding: 24, width: 420, maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Key size={18} color="#a78bfa" />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Settings</span>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>OPENAI API KEY</div>
        <input
          type="text"
          value={key}
          onChange={e => { setKey(e.target.value); setSaved(false); }}
          placeholder="sk-..."
          style={{ marginBottom: 8 }}
          autoFocus
        />
        <div style={{ fontSize: 11, color: '#4a4a6a', marginBottom: 16, lineHeight: 1.5 }}>
          Your key is stored in localStorage and never sent anywhere except directly to OpenAI's API.
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={save}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 8,
              background: saved ? '#10b981' : '#6366f1', border: 'none',
              color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {saved ? '✓ Saved' : 'Save Key'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px', borderRadius: 8,
              background: '#13131e', border: '1px solid #2d2d3f',
              color: '#94a3b8', fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
