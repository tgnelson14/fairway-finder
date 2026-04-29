import { useState, useEffect } from 'react';
import type { TeeData, CheckIn } from '../types';
import type { Theme } from '../contexts/ThemeContext';
import { useGpsPosition } from '../hooks/useGpsPosition';
import { useHolePins } from '../hooks/useHolePins';
import { fetchGolfHoleWaypoints } from '../services/overpass';
import type { HoleWaypoints } from '../services/overpass';
import { HoleMap } from './HoleMap';

interface Props {
  courseId: string;
  courseName: string;
  courseCity: string;
  courseSt: string;
  courseLat: number;
  courseLng: number;
  tee: TeeData;
  date: string;
  userId: string;
  theme: Theme;
  onClose: () => void;
}

function scoreLabel(diff: number): { text: string; color: string } {
  if (diff <= -2) return { text: 'Eagle', color: '#D4A017' };
  if (diff === -1) return { text: 'Birdie', color: '#4A9B6F' };
  if (diff === 0)  return { text: 'Par',    color: '#888' };
  if (diff === 1)  return { text: 'Bogey',  color: '#C9893A' };
  if (diff === 2)  return { text: 'Double', color: '#C0392B' };
  return { text: 'Triple+', color: '#C0392B' };
}

function cellBg(diff: number) {
  if (diff <= -1) return 'rgba(74,155,111,0.25)';
  if (diff === 0) return 'transparent';
  if (diff === 1) return 'rgba(201,137,58,0.25)';
  return 'rgba(192,57,43,0.25)';
}

export function ActiveRoundPanel({ courseId, courseName, courseCity, courseSt, courseLat, courseLng, tee, date, userId, theme, onClose }: Props) {
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState<number[]>(tee.holes.map(h => h.par));
  const [osmWaypoints, setOsmWaypoints] = useState<HoleWaypoints[]>([]);

  const { position: gps } = useGpsPosition();
  const { getPin, setPin, clearPin } = useHolePins(courseId);

  // Try to load OSM hole waypoints once
  useEffect(() => {
    fetchGolfHoleWaypoints(courseLat, courseLng)
      .then(setOsmWaypoints)
      .catch(() => setOsmWaypoints([]));
  }, [courseLat, courseLng]);

  const totalHoles = tee.holes.length;
  const hole = tee.holes[current];
  const score = scores[current];
  const diff = score - hole.par;
  const label = scoreLabel(diff);

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const totalDiff  = totalScore - tee.par_total;

  // Resolve green position: user pin > OSM data
  const osmGreen = osmWaypoints.find(w => w.holeNumber === current + 1)?.green ?? null;
  const userPin  = getPin(current + 1);
  const green    = userPin ?? osmGreen;

  function adjust(delta: number) {
    setScores(prev => {
      const next = [...prev];
      next[current] = Math.max(1, next[current] + delta);
      return next;
    });
  }

  function handleSave() {
    const checkIn: CheckIn = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      courseId, courseName, courseCity, courseSt, date,
      score: totalScore,
      notes: `${tee.tee_name} tees • ${totalHoles} holes`,
      holeScores: scores,
    };
    const key = `checkins-${userId}`;
    const existing: CheckIn[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([checkIn, ...existing]));
    onClose();
  }

  const totalDiffStr = totalDiff === 0 ? 'E' : totalDiff > 0 ? `+${totalDiff}` : String(totalDiff);
  const totalDiffColor = totalDiff === 0 ? theme.textSub : totalDiff < 0 ? '#4A9B6F' : '#C9893A';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: theme.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {/* Top bar */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: 8,
        borderBottom: `1px solid ${theme.border}`,
        background: theme.surface, flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: `1px solid ${theme.border}`,
            cursor: 'pointer', color: theme.danger,
            fontSize: 12, fontWeight: 600, padding: '6px 12px',
            borderRadius: 8, fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Abandon
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {courseName}
          </div>
          <div style={{ fontSize: 10, color: theme.textMuted }}>
            {tee.tee_name} tees • {totalHoles} holes
          </div>
        </div>
        <button
          onClick={handleSave}
          style={{
            background: theme.primary, border: 'none',
            cursor: 'pointer', color: '#fff',
            fontSize: 12, fontWeight: 600, padding: '8px 14px',
            borderRadius: 8, fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Save
        </button>
      </div>

      {/* Hole info strip */}
      <div style={{
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        padding: '8px 16px',
        display: 'flex', alignItems: 'center', gap: 0,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flex: 1 }}>
          <span style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 28, fontWeight: 700, color: theme.text, lineHeight: 1,
          }}>
            {current + 1}
          </span>
          <span style={{ fontSize: 11, color: theme.textMuted }}>/ {totalHoles}</span>
        </div>

        <div style={{ display: 'flex', gap: 18 }}>
          {[
            { label: 'Par',   value: hole.par },
            hole.yardage  ? { label: 'Yds', value: hole.yardage }  : null,
            hole.handicap ? { label: 'HCP', value: hole.handicap } : null,
          ].filter(Boolean).map(s => (
            <div key={s!.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s!.label}</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: theme.primary, lineHeight: 1 }}>{s!.value}</div>
            </div>
          ))}
        </div>

        {/* GPS dot */}
        <div style={{
          marginLeft: 16,
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: gps ? '#4A9B6F' : '#aaa',
          boxShadow: gps ? '0 0 0 3px rgba(74,155,111,0.25)' : 'none',
        }} />
      </div>

      {/* Satellite hole map — takes up remaining space */}
      <HoleMap
        holeNumber={current + 1}
        courseLat={courseLat}
        courseLng={courseLng}
        player={gps}
        green={green}
        onSetGreen={(lat, lng) => setPin(current + 1, { lat, lng })}
        onClearGreen={() => clearPin(current + 1)}
        theme={theme}
      />

      {/* Score entry + prev/next */}
      <div style={{
        background: theme.surface,
        borderTop: `1px solid ${theme.border}`,
        padding: '10px 16px',
        flexShrink: 0,
      }}>
        {/* Score row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 10 }}>
          <button
            onClick={() => adjust(-1)}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: theme.surfaceAlt, border: `2px solid ${theme.border}`,
              cursor: 'pointer', fontSize: 28, color: theme.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 300, lineHeight: 1,
            }}
          >
            −
          </button>

          <div style={{ textAlign: 'center', minWidth: 72 }}>
            <div style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 56, fontWeight: 700, color: theme.text, lineHeight: 1,
            }}>
              {score}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: label.color, marginTop: 2 }}>
              {diff === 0 ? 'Par' : `${diff > 0 ? '+' : ''}${diff} · ${label.text}`}
            </div>
          </div>

          <button
            onClick={() => adjust(1)}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: theme.surfaceAlt, border: `2px solid ${theme.border}`,
              cursor: 'pointer', fontSize: 28, color: theme.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 300, lineHeight: 1,
            }}
          >
            +
          </button>
        </div>

        {/* Prev / Next */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            style={{
              flex: 1, padding: '11px', borderRadius: 10,
              background: 'none', border: `1px solid ${theme.border}`,
              cursor: current === 0 ? 'default' : 'pointer',
              color: current === 0 ? theme.textMuted : theme.textSub,
              fontSize: 13, fontFamily: 'DM Sans, sans-serif',
              opacity: current === 0 ? 0.35 : 1,
            }}
          >
            ← Prev
          </button>
          <button
            onClick={() => setCurrent(Math.min(totalHoles - 1, current + 1))}
            disabled={current === totalHoles - 1}
            style={{
              flex: 1, padding: '11px', borderRadius: 10,
              background: current < totalHoles - 1 ? theme.primary : 'none',
              border: current < totalHoles - 1 ? 'none' : `1px solid ${theme.border}`,
              cursor: current === totalHoles - 1 ? 'default' : 'pointer',
              color: current < totalHoles - 1 ? '#fff' : theme.textMuted,
              fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
              opacity: current === totalHoles - 1 ? 0.35 : 1,
            }}
          >
            Next →
          </button>
        </div>

        {/* Mini scorecard + totals */}
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto' }}>
          {/* Running totals */}
          <div style={{
            minWidth: 48, flexShrink: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            borderRight: `1px solid ${theme.border}`, paddingRight: 6, marginRight: 1,
          }}>
            <div style={{ fontSize: 9, color: theme.textMuted, textTransform: 'uppercase' }}>Tot</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, color: theme.text }}>{totalScore}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, fontWeight: 700, color: totalDiffColor }}>{totalDiffStr}</div>
          </div>

          {scores.map((s, i) => {
            const d = s - tee.holes[i].par;
            const isActive = i === current;
            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  minWidth: 36, height: 46, borderRadius: 7, flexShrink: 0,
                  background: isActive ? theme.primary : cellBg(d),
                  border: `1px solid ${isActive ? theme.primary : theme.border}`,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 1,
                }}
              >
                <div style={{ fontSize: 9, color: isActive ? 'rgba(255,255,255,0.65)' : theme.textMuted }}>
                  {i + 1}
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: isActive ? '#fff' : d < 0 ? '#4A9B6F' : d === 0 ? theme.textSub : d === 1 ? '#C9893A' : '#C0392B',
                }}>
                  {s}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
