import { useState } from 'react';
import { useCourseDetail } from '../hooks/useCourseDetail';
import { useCourseWeather } from '../hooks/useCourseWeather';
import { Scorecard } from './Scorecard';
import type { CourseIndex } from '../types';
import type { Theme } from '../contexts/ThemeContext';

interface CourseDetailProps {
  courseId: string;
  course: CourseIndex & { distance: number };
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (courseId: string) => void;
  theme: Theme;
}

type Tab = 'overview' | 'scorecard' | 'weather';

function weatherLabel(code: number | null) {
  if (code === null) return 'Conditions unavailable';
  if ([0].includes(code)) return 'Clear';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Storms';
  return 'Mixed conditions';
}

function golfWeatherNote(code: number | null, windSpeed: number | null, precip: number | null) {
  if ((precip ?? 0) > 0.05 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code ?? -1)) {
    return 'Rain risk. Pack layers and a towel.';
  }
  if ((windSpeed ?? 0) >= 18) return 'Windy conditions. Expect tougher club selection.';
  if ([0, 1].includes(code ?? -1)) return 'Great golf weather right now.';
  return 'Playable conditions with a few variables.';
}

function formatTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function CourseDetail({ courseId, course, onClose, isFavorite, onToggleFavorite, theme }: CourseDetailProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const { course: detail, loading, error } = useCourseDetail(courseId);
  const { weather, loading: weatherLoading, error: weatherError } = useCourseWeather(
    courseId,
    course.lat,
    course.lng
  );

  const firstTee = detail?.tees.male?.[0] || detail?.tees.female?.[0];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: theme.surface,
      display: 'flex', flexDirection: 'column',
      animation: 'slideIn 0.25s ease',
      overflow: 'hidden',
    }}>
      {/* Hero */}
      <div style={{
        height: 140,
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
        position: 'relative', flexShrink: 0,
      }}>
        {/* Subtle pattern */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.07 }}>
          <svg width="100%" height="100%" viewBox="0 0 200 140">
            <path d="M0 70 Q50 40 100 70 Q150 100 200 70" stroke="white" fill="none" strokeWidth="24"/>
            <circle cx="30" cy="50" r="28" fill="white"/>
            <circle cx="170" cy="95" r="20" fill="white"/>
          </svg>
        </div>

        {/* Back button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(255,255,255,0.15)',
            border: 'none', cursor: 'pointer',
            width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        <button
          onClick={() => onToggleFavorite(course.id)}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(255,255,255,0.15)',
            border: 'none', cursor: 'pointer',
            width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            color: isFavorite ? '#fff' : 'rgba(255,255,255,0.75)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </button>

        {/* Course name */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2,
          }}>
            {course.n}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
            {course.city}, {course.st}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        {[
          { label: 'Distance', value: `${course.distance.toFixed(1)} mi` },
          { label: 'Holes', value: course.holes ?? '—' },
          { label: 'Par', value: course.par ?? '—' },
          { label: 'Rating', value: course.rating ? course.rating.toFixed(1) : '—' },
        ].map((s, i) => (
          <div
            key={s.label}
            style={{
              flex: 1, padding: '12px 8px', textAlign: 'center',
              borderRight: i < 3 ? `1px solid ${theme.border}` : 'none',
            }}
          >
            <div style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 18, fontWeight: 600, color: theme.primary,
            }}>
              {s.value}
            </div>
            <div style={{
              fontSize: 10, color: theme.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2,
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        {(['overview', 'scorecard', 'weather'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '10px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 500, fontFamily: 'DM Sans, sans-serif',
              color: tab === t ? theme.primary : theme.textMuted,
              borderBottom: `2px solid ${tab === t ? theme.primary : 'transparent'}`,
              textTransform: 'capitalize', transition: 'all 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {tab === 'overview' && (
          <div>
            {/* Address */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11, color: theme.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
              }}>
                Location
              </div>
              <p style={{ fontSize: 13, color: theme.textSub, lineHeight: 1.6 }}>
                {detail?.location.address || course.addr || `${course.city}, ${course.st}`}
              </p>
            </div>

            {/* Course stats boxes */}
            {firstTee && (
              <div>
                <div style={{
                  fontSize: 11, color: theme.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
                }}>
                  Course Stats
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <StatBox label="Course Rating" value={firstTee.course_rating.toFixed(1)} theme={theme} />
                  <StatBox label="Slope" value={firstTee.slope_rating} theme={theme} />
                  <StatBox label="Total Yards" value={firstTee.total_yards.toLocaleString()} theme={theme} />
                  <StatBox label="Par" value={firstTee.par_total} theme={theme} />
                </div>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: 24, color: theme.textMuted, fontSize: 13 }}>
                Loading course details…
              </div>
            )}
            {error && (
              <div style={{ textAlign: 'center', padding: 16, color: theme.danger, fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>
        )}

        {tab === 'scorecard' && (
          <div>
            {loading && (
              <div style={{ textAlign: 'center', padding: 24, color: theme.textMuted, fontSize: 13 }}>
                Loading scorecard…
              </div>
            )}
            {error && (
              <div style={{ textAlign: 'center', padding: 16, color: theme.danger, fontSize: 13 }}>
                {error}
              </div>
            )}
            {detail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {detail.tees.male?.map((tee, i) => (
                  <Scorecard key={`m-${i}`} tees={tee} label={`Men's — ${tee.tee_name}`} />
                ))}
                {detail.tees.female?.map((tee, i) => (
                  <Scorecard key={`f-${i}`} tees={tee} label={`Women's — ${tee.tee_name}`} />
                ))}
                {!detail.tees.male?.length && !detail.tees.female?.length && (
                  <p style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center', padding: '16px 0' }}>
                    No scorecard data available.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'weather' && (
          <div>
            {weatherLoading && (
              <div style={{ textAlign: 'center', padding: 24, color: theme.textMuted, fontSize: 13 }}>
                Loading weather…
              </div>
            )}
            {weatherError && (
              <div style={{ textAlign: 'center', padding: 16, color: theme.danger, fontSize: 13 }}>
                {weatherError}
              </div>
            )}
            {weather && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  padding: 16,
                  borderRadius: 14,
                  background: theme.surfaceAlt,
                  border: `1px solid ${theme.border}`,
                }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: theme.primary }}>
                    {weather.current.temperature !== null ? `${Math.round(weather.current.temperature)}°` : '—'}
                  </div>
                  <div style={{ fontSize: 13, color: theme.textSub, marginTop: 4 }}>
                    {weatherLabel(weather.current.weatherCode)} • Feels like {weather.current.apparentTemperature !== null ? `${Math.round(weather.current.apparentTemperature)}°` : '—'}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }}>
                    {golfWeatherNote(weather.current.weatherCode, weather.current.windSpeed, weather.current.precipitation)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <StatBox label="Wind" value={weather.current.windSpeed !== null ? `${Math.round(weather.current.windSpeed)} mph` : '—'} theme={theme} />
                  <StatBox label="Gusts" value={weather.current.windGusts !== null ? `${Math.round(weather.current.windGusts)} mph` : '—'} theme={theme} />
                  <StatBox label="Sunrise" value={formatTime(weather.daily.sunrise)} theme={theme} />
                  <StatBox label="Sunset" value={formatTime(weather.daily.sunset)} theme={theme} />
                </div>

                <div>
                  <div style={{
                    fontSize: 11, color: theme.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
                  }}>
                    Next 8 Hours
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
                    {weather.hourly.map((hour) => (
                      <div
                        key={hour.time}
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          background: theme.surfaceAlt,
                          border: `1px solid ${theme.border}`,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 11, color: theme.textMuted }}>
                          {formatTime(hour.time)}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginTop: 6 }}>
                          {hour.temperature !== null ? `${Math.round(hour.temperature)}°` : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: theme.textSub, marginTop: 4 }}>
                          {hour.precipitationProbability !== null ? `${Math.round(hour.precipitationProbability)}% rain` : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                          {hour.windSpeed !== null ? `${Math.round(hour.windSpeed)} mph` : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <button
          onClick={() => {
            const q = encodeURIComponent(`${course.n} ${course.city} ${course.st} golf course directions`);
            window.open(`https://www.google.com/maps/search/${q}`, '_blank');
          }}
          style={{
            width: '100%', padding: '14px',
            background: theme.primary, color: '#fff',
            border: 'none', borderRadius: 12, cursor: 'pointer',
            fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Get Directions
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value, theme }: { label: string; value: string | number; theme: Theme }) {
  return (
    <div style={{
      padding: '14px', background: theme.surfaceAlt,
      borderRadius: 10, textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 22, fontWeight: 700, color: theme.primary,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{label}</div>
    </div>
  );
}
