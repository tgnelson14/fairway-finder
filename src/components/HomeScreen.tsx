import { useState } from 'react';
import type { Theme } from '../contexts/ThemeContext';

interface HomeScreenProps {
  onSearch: (query: string, radius: number) => void;
  onSearchByCoords: (lat: number, lng: number, radius: number) => void;
  loading: boolean;
  theme: Theme;
}

export function HomeScreen({ onSearch, onSearchByCoords, loading, theme }: HomeScreenProps) {
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [radius, setRadius] = useState(30);

  const handleSearch = () => {
    if (query.trim()) onSearch(query.trim(), radius);
  };

  const handleLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onSearchByCoords(pos.coords.latitude, pos.coords.longitude, radius);
      },
      () => {
        setLocating(false);
      }
    );
  };

  return (
    <div style={{ height: '100vh', background: theme.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Centered content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32, textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: theme.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28,
        }}>
          <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2v15"/>
            <path d="M12 2l7 4-7 4"/>
            <circle cx="12" cy="20" r="2"/>
          </svg>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(32px, 5vw, 48px)',
          fontWeight: 700, color: theme.text, lineHeight: 1.15, marginBottom: 14,
        }}>
          Find Your<br />
          <span style={{ color: theme.primary }}>Perfect Round</span>
        </h1>
        <p style={{
          fontSize: 15, color: theme.textSub,
          maxWidth: 340, lineHeight: 1.65, marginBottom: 40,
        }}>
          Discover golf courses near you with ratings, scorecards, and course details.
          Choose a wider radius for zip code searches.
        </p>

        {/* Search area */}
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 16px', background: theme.surface,
              borderRadius: 14, border: `1px solid ${theme.border}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <svg width="18" height="18" fill="none" stroke={theme.textMuted} strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="City, zip code, or course name"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  background: 'transparent', fontSize: 14,
                  color: theme.text, fontFamily: 'DM Sans, sans-serif',
                }}
              />
            </div>
            <select
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              aria-label="Search radius"
              style={{
                padding: '0 14px', borderRadius: 14,
                border: `1px solid ${theme.border}`,
                background: theme.surface,
                color: theme.text,
                fontSize: 13,
                fontFamily: 'DM Sans, sans-serif',
                outline: 'none',
                flexShrink: 0,
              }}
            >
              <option value={10}>10 mi</option>
              <option value={20}>20 mi</option>
              <option value={30}>30 mi</option>
              <option value={50}>50 mi</option>
              <option value={100}>100 mi</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              style={{
                padding: '0 22px', borderRadius: 14,
                background: query.trim() && !loading ? theme.primary : theme.border,
                border: 'none',
                cursor: query.trim() && !loading ? 'pointer' : 'default',
                color: '#fff', fontSize: 14, fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap',
                flexShrink: 0, transition: 'background 0.15s',
              }}
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>

          <button
            onClick={handleLocation}
            disabled={locating}
            style={{
              width: '100%', padding: '13px', borderRadius: 14,
              background: theme.accentLight, border: `1px solid ${theme.border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              color: theme.primary, fontSize: 13, fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif', transition: 'opacity 0.15s',
            }}
          >
            <svg width="15" height="15" fill="none" stroke={theme.primary} strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            {locating ? 'Getting location…' : 'Use My Current Location'}
          </button>
        </div>

        {/* Quick cities */}
        <div style={{ display: 'flex', gap: 8, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['San Francisco, CA', 'Pebble Beach, CA', 'Augusta, GA', 'Scottsdale, AZ'].map(loc => (
            <button
              key={loc}
              onClick={() => onSearch(loc, radius)}
              style={{
                padding: '7px 14px', borderRadius: 20,
                background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
                cursor: 'pointer', fontSize: 12, color: theme.textSub,
                fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
              }}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
