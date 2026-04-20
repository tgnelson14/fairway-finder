import { useState } from 'react';
import type { Theme } from '../contexts/ThemeContext';

interface Filters {
  holes: string;
}

interface FiltersPanelProps {
  onClose: () => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  radius: number;
  onApply: (radius: number) => void;
  theme: Theme;
}

export function FiltersPanel({ onClose, filters, setFilters, radius: initialRadius, onApply, theme }: FiltersPanelProps) {
  const [localRadius, setLocalRadius] = useState(initialRadius);
  const [localHoles, setLocalHoles] = useState(filters.holes);

  const handleApply = () => {
    setFilters({ holes: localHoles });
    onApply(localRadius);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      background: theme.surface, overflow: 'auto',
      animation: 'slideIn 0.2s ease',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px', borderBottom: `1px solid ${theme.border}`,
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: theme.text }}>
          Filters
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <svg width="20" height="20" fill="none" stroke={theme.textSub} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div style={{ padding: 16, flex: 1 }}>
        {/* Search Radius */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: theme.text,
            marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Search Radius
          </div>
          <input
            type="range" min="5" max="100" step="5"
            value={localRadius}
            onChange={e => setLocalRadius(+e.target.value)}
            style={{ width: '100%', accentColor: theme.primary }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: theme.textSub, marginTop: 4 }}>
            <span>5 mi</span>
            <span style={{ fontWeight: 600, color: theme.primary }}>{localRadius} mi</span>
            <span>100 mi</span>
          </div>
        </div>

        {/* Holes */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: theme.text,
            marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Holes
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Any', '9', '18', '27'].map(h => (
              <button
                key={h}
                onClick={() => setLocalHoles(h)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8,
                  border: `1px solid ${localHoles === h ? theme.primary : theme.border}`,
                  background: localHoles === h ? theme.primary : 'none',
                  color: localHoles === h ? '#fff' : theme.textSub,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
                }}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Apply */}
        <button
          onClick={handleApply}
          style={{
            width: '100%', padding: 14, borderRadius: 12,
            background: theme.primary, border: 'none',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
