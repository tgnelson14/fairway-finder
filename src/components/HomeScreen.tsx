import { useEffect, useRef, useState } from 'react';
import type { Theme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface HomeScreenProps {
  onSearch: (query: string, radius: number) => void;
  onSearchByCoords: (lat: number, lng: number, radius: number) => void;
  loading: boolean;
  theme: Theme;
  onOpenProfile: () => void;
}

type Suggestion = {
  shortName: string;
  fullName: string;
  lat: number;
  lng: number;
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
};

function toShortName(r: NominatimResult): string {
  const a = r.address;
  const locality = a?.city || a?.town || a?.village || a?.county;
  if (locality && a?.state) return `${locality}, ${a.state}`;
  if (locality && a?.country) return `${locality}, ${a.country}`;
  // Fall back to first two segments of display_name
  return r.display_name.split(',').slice(0, 2).join(',').trim();
}

export function HomeScreen({ onSearch, onSearchByCoords, loading, theme, onOpenProfile }: HomeScreenProps) {
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [radius, setRadius] = useState(30);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [fetching, setFetching] = useState(false);
  const { user, login } = useAuth();
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced autocomplete fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setFetching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
          {
            headers: { 'User-Agent': 'FairwayFinder/1.0' },
            signal: abortRef.current.signal,
          }
        );
        const results: NominatimResult[] = await res.json();
        const seen = new Set<string>();
        const next: Suggestion[] = [];
        for (const r of results) {
          const shortName = toShortName(r);
          if (!seen.has(shortName)) {
            seen.add(shortName);
            next.push({ shortName, fullName: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
          }
        }
        setSuggestions(next);
        setShowSuggestions(next.length > 0);
        setHighlighted(-1);
      } catch {
        // AbortError or network failure — ignore
      } finally {
        setFetching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const commitSuggestion = (s: Suggestion) => {
    setQuery(s.shortName);
    setSuggestions([]);
    setShowSuggestions(false);
    onSearchByCoords(s.lat, s.lng, radius);
  };

  const handleSearch = () => {
    if (query.trim()) {
      setShowSuggestions(false);
      onSearch(query.trim(), radius);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') handleSearch();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0) {
        commitSuggestion(suggestions[highlighted]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlighted(-1);
    }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onSearchByCoords(pos.coords.latitude, pos.coords.longitude, radius);
      },
      () => setLocating(false)
    );
  };

  return (
    <div style={{ height: '100vh', background: theme.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <div style={{
        height: 56, background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700,
          color: theme.primary, letterSpacing: '-0.02em',
        }}>
          Fairway
        </div>
        <button
          onClick={() => user ? onOpenProfile() : login()}
          style={{
            background: user ? theme.primary : 'none',
            border: user ? 'none' : `1px solid ${theme.border}`,
            cursor: 'pointer', borderRadius: '50%',
            width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: user ? '#fff' : theme.textSub,
            fontSize: 13, fontWeight: 600,
            fontFamily: 'DM Sans, sans-serif',
          }}
          title={user ? 'My profile' : 'Sign in'}
        >
          {user
            ? (user.user_metadata?.full_name || user.email).charAt(0).toUpperCase()
            : (
              <svg width="16" height="16" fill="none" stroke={theme.textSub} strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )
          }
        </button>
      </div>

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
          <div className="home-search-row" style={{ display: 'flex', gap: 10, marginBottom: 12 }}>

            {/* Input with autocomplete dropdown */}
            <div ref={containerRef} style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <div
                className="home-search-input-wrap"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', background: theme.surface,
                  borderRadius: showSuggestions ? '14px 14px 0 0' : 14,
                  border: `1px solid ${showSuggestions ? theme.primary : theme.border}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'border-color 0.15s',
                }}
              >
                {fetching ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2"
                    style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" stroke={theme.textMuted} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                )}
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  placeholder="City, zip code, or course name"
                  autoComplete="off"
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    background: 'transparent', fontSize: 14,
                    color: theme.text, fontFamily: 'DM Sans, sans-serif',
                  }}
                />
                {query && (
                  <button
                    onClick={() => { setQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', color: theme.textMuted, flexShrink: 0,
                    }}
                    aria-label="Clear"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                  background: theme.surface,
                  border: `1px solid ${theme.primary}`,
                  borderTop: `1px solid ${theme.border}`,
                  borderRadius: '0 0 14px 14px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                  overflow: 'hidden',
                }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={e => { e.preventDefault(); commitSuggestion(s); }}
                      onMouseEnter={() => setHighlighted(i)}
                      style={{
                        width: '100%', padding: '11px 16px',
                        background: i === highlighted ? theme.accentLight : 'transparent',
                        border: 'none',
                        borderTop: i === 0 ? 'none' : `1px solid ${theme.border}`,
                        cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'background 0.1s',
                      }}
                    >
                      <svg width="13" height="13" fill="none" stroke={theme.primary} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        <circle cx="12" cy="9" r="2.5"/>
                      </svg>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600, color: theme.text,
                          fontFamily: 'DM Sans, sans-serif',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {s.shortName}
                        </div>
                        <div style={{
                          fontSize: 11, color: theme.textMuted,
                          fontFamily: 'DM Sans, sans-serif',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          marginTop: 1,
                        }}>
                          {s.fullName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="home-search-controls">
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
