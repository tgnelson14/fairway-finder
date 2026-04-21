import { useState } from 'react';
import type { Theme } from '../contexts/ThemeContext';
import type { CheckIn, CourseIndex } from '../types/index';
import { useAuth } from '../contexts/AuthContext';

interface UserPanelProps {
  onClose: () => void;
  theme: Theme;
  favoriteCount: number;
  favoriteCourses: CourseIndex[];
  onSelectFavorite: (course: CourseIndex) => void;
}

function getCheckIns(userId: string): CheckIn[] {
  try {
    return JSON.parse(localStorage.getItem(`checkins-${userId}`) || '[]');
  } catch { return []; }
}

function computeStats(checkIns: CheckIn[]) {
  const scored = checkIns.filter(c => c.score != null);
  const year = new Date().getFullYear().toString();
  const thisYear = checkIns.filter(c => c.date.startsWith(year)).length;
  const best = scored.length ? Math.min(...scored.map(c => c.score!)) : null;
  const avg = scored.length
    ? Math.round(scored.reduce((s, c) => s + c.score!, 0) / scored.length)
    : null;

  const counts: Record<string, { name: string; count: number }> = {};
  for (const c of checkIns) {
    if (!counts[c.courseId]) counts[c.courseId] = { name: c.courseName, count: 0 };
    counts[c.courseId].count++;
  }
  const mostPlayed = Object.values(counts).sort((a, b) => b.count - a.count)[0] ?? null;

  return { thisYear, best, avg, mostPlayed };
}

export function UserPanel({ onClose, theme, favoriteCount, favoriteCourses, onSelectFavorite }: UserPanelProps) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'rounds' | 'saved'>('rounds');
  const checkIns = user ? getCheckIns(user.id) : [];
  const stats = computeStats(checkIns);
  const name = user?.user_metadata?.full_name || user?.email.split('@')[0] || 'Golfer';
  const initial = name.charAt(0).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 56, left: 0, bottom: 0,
        width: 'min(360px, 100vw)',
        background: theme.surface,
        borderRight: `1px solid ${theme.border}`,
        zIndex: 100,
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.25s ease',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 16px',
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
          position: 'relative', flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              cursor: 'pointer', width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12,
          }}>
            {initial}
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
            {user?.email}
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Playfair Display, serif' }}>
                {checkIns.length}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Rounds
              </div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Playfair Display, serif' }}>
                {favoriteCount}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Saved
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
          {(['rounds', 'saved'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 0',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 500, fontFamily: 'DM Sans, sans-serif',
                color: tab === t ? theme.primary : theme.textMuted,
                borderBottom: `2px solid ${tab === t ? theme.primary : 'transparent'}`,
                transition: 'all 0.15s',
              }}
            >
              {t === 'rounds' ? 'Rounds' : `Saved (${favoriteCount})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>

          {/* ── Rounds tab ── */}
          {tab === 'rounds' && (
            <>
              {checkIns.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SectionLabel text="Stats" theme={theme} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <StatBox label="This Year" value={stats.thisYear} theme={theme} />
                    <StatBox label="Best Score" value={stats.best ?? '—'} theme={theme} />
                    <StatBox label="Avg Score" value={stats.avg ?? '—'} theme={theme} />
                    <StatBox label="Total Rounds" value={checkIns.length} theme={theme} />
                  </div>
                  {stats.mostPlayed && stats.mostPlayed.count > 1 && (
                    <div style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
                    }}>
                      <div style={{ fontSize: 10, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Most Played
                      </div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, fontWeight: 600, color: theme.text, marginTop: 4 }}>
                        {stats.mostPlayed.name}
                      </div>
                      <div style={{ fontSize: 11, color: theme.textSub, marginTop: 2 }}>
                        {stats.mostPlayed.count} rounds
                      </div>
                    </div>
                  )}
                </div>
              )}

              <SectionLabel text="Round History" theme={theme} />
              {checkIns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: theme.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                  No rounds logged yet.<br />
                  Open a course and tap <strong style={{ color: theme.textSub }}>Log Round</strong> to get started.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {checkIns.map((c) => (
                    <div key={c.id} style={{
                      padding: '12px 14px', borderRadius: 12,
                      background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: 'Playfair Display, serif',
                            fontSize: 14, fontWeight: 600, color: theme.text,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {c.courseName}
                          </div>
                          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                            {c.courseCity}, {c.courseSt}
                          </div>
                        </div>
                        {c.score != null && (
                          <div style={{
                            background: theme.primary, color: '#fff',
                            borderRadius: 8, padding: '4px 10px',
                            fontSize: 14, fontWeight: 700,
                            fontFamily: 'Playfair Display, serif',
                            flexShrink: 0, marginLeft: 10,
                          }}>
                            {c.score}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 8 }}>
                        {new Date(c.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      {c.notes && (
                        <div style={{ fontSize: 12, color: theme.textSub, marginTop: 6, fontStyle: 'italic' }}>
                          {c.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Saved tab ── */}
          {tab === 'saved' && (
            favoriteCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: theme.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                No saved courses yet.<br />
                Tap ★ on any course card to save it here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {favoriteCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => onSelectFavorite(course)}
                    style={{
                      padding: '12px 14px', borderRadius: 12,
                      background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: 14, fontWeight: 600, color: theme.text,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {course.n}
                      </div>
                      <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                        {course.city}, {course.st}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        {course.holes && (
                          <span style={{ fontSize: 11, color: theme.textSub }}>{course.holes} holes</span>
                        )}
                        {course.par && (
                          <span style={{ fontSize: 11, color: theme.textSub }}>Par {course.par}</span>
                        )}
                        {course.rating && (
                          <span style={{ fontSize: 11, color: theme.accent, fontWeight: 600 }}>
                            ★ {course.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <svg width="16" height="16" fill="none" stroke={theme.textMuted} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginLeft: 8 }}>
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
          <button
            onClick={() => { logout(); onClose(); }}
            style={{
              width: '100%', padding: '12px',
              background: 'none', border: `1px solid ${theme.border}`,
              borderRadius: 10, cursor: 'pointer',
              fontSize: 13, color: theme.textSub,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

function SectionLabel({ text, theme }: { text: string; theme: Theme }) {
  return (
    <div style={{
      fontSize: 11, color: theme.textMuted,
      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
    }}>
      {text}
    </div>
  );
}

function StatBox({ label, value, theme }: { label: string; value: string | number; theme: Theme }) {
  return (
    <div style={{
      padding: 12, borderRadius: 10, textAlign: 'center',
      background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
    }}>
      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 20, fontWeight: 700, color: theme.primary,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
    </div>
  );
}
