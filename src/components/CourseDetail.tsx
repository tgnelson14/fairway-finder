import { useState } from 'react';
import { useCourseDetail } from '../hooks/useCourseDetail';
import { Scorecard } from './Scorecard';
import type { CourseIndex } from '../types';
import type { Theme } from '../contexts/ThemeContext';

interface CourseDetailProps {
  courseId: number;
  course: CourseIndex & { distance: number };
  onClose: () => void;
  theme: Theme;
}

type Tab = 'overview' | 'scorecard';

export function CourseDetail({ courseId, course, onClose, theme }: CourseDetailProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const { course: detail, loading, error } = useCourseDetail(courseId);

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
        {(['overview', 'scorecard'] as Tab[]).map(t => (
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
