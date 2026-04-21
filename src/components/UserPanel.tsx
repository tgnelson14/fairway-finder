import type { Theme } from '../contexts/ThemeContext';
import type { CheckIn } from '../types/index';
import { useAuth } from '../contexts/AuthContext';

interface UserPanelProps {
  onClose: () => void;
  theme: Theme;
  favoriteCount: number;
}

function getCheckIns(userId: string): CheckIn[] {
  try {
    return JSON.parse(localStorage.getItem(`checkins-${userId}`) || '[]');
  } catch { return []; }
}

export function UserPanel({ onClose, theme, favoriteCount }: UserPanelProps) {
  const { user, logout } = useAuth();
  const checkIns = user ? getCheckIns(user.id) : [];
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

        {/* Round history */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <div style={{
            fontSize: 11, color: theme.textMuted,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
          }}>
            Round History
          </div>

          {checkIns.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 16px',
              color: theme.textMuted, fontSize: 13, lineHeight: 1.7,
            }}>
              No rounds logged yet.<br />
              Open a course and tap <strong style={{ color: theme.textSub }}>Log Round</strong> to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {checkIns.map((c) => (
                <div key={c.id} style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: theme.surfaceAlt,
                  border: `1px solid ${theme.border}`,
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
