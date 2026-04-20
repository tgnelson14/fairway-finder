import type { CourseIndex } from '../types';
import { useTheme, type Theme } from '../contexts/ThemeContext';

interface CourseCardProps {
  course: CourseIndex & { distance: number };
  selected?: boolean;
  isFavorite?: boolean;
  onClick?: () => void;
  index?: number;
  hovered?: boolean;
  onSelect?: () => void;
  onHover?: (value: string | null) => void;
  onToggleFavorite?: (courseId: string) => void;
  theme?: Theme;
}

export function CourseCard({
  course,
  index,
  selected,
  hovered,
  isFavorite,
  onClick,
  onSelect,
  onHover,
  onToggleFavorite,
  theme,
}: CourseCardProps) {
  const { theme: contextTheme } = useTheme();
  const resolvedTheme = theme ?? contextTheme;
  const active = selected || hovered;
  const handleSelect = onSelect ?? onClick;

  return (
    <div
      onClick={handleSelect}
      onMouseEnter={() => onHover?.(course.id)}
      onMouseLeave={() => onHover?.(null)}
      style={{
        padding: '16px',
        borderBottom: `1px solid ${resolvedTheme.border}`,
        background: active ? resolvedTheme.surfaceAlt : resolvedTheme.surface,
        cursor: 'pointer',
        transition: 'background 0.15s',
        position: 'relative',
      }}
    >
      {/* Index badge */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        width: 26, height: 26, borderRadius: '50%',
        background: active ? resolvedTheme.primary : resolvedTheme.border,
        color: active ? '#fff' : resolvedTheme.textSub,
        fontSize: 11, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', flexShrink: 0,
      }}>
        {(index ?? 0) + 1}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(course.id);
        }}
        aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: `1px solid ${resolvedTheme.border}`,
          background: resolvedTheme.surface,
          color: isFavorite ? resolvedTheme.accent : resolvedTheme.textMuted,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      </button>

      <div style={{ paddingLeft: 38, paddingRight: 36 }}>
        {/* Name + distance */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 15, fontWeight: 600,
              color: resolvedTheme.text, lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {course.n}
            </div>
            {course.cn !== course.n && (
              <div style={{ fontSize: 11, color: resolvedTheme.textSub, marginTop: 1 }}>{course.cn}</div>
            )}
            <div style={{ fontSize: 12, color: resolvedTheme.textSub, marginTop: 2 }}>
              {course.city}, {course.st}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: resolvedTheme.primary }}>
              {course.distance.toFixed(1)} mi
            </div>
            {course.holes && (
              <div style={{ fontSize: 11, color: resolvedTheme.textMuted }}>{course.holes} holes</div>
            )}
          </div>
        </div>

        {/* Stats chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {course.par && (
            <Chip label={`Par ${course.par}`} theme={resolvedTheme} primary />
          )}
          {course.rating && (
            <Chip label={`⭐ ${course.rating.toFixed(1)}`} theme={resolvedTheme} />
          )}
          {course.slope && (
            <Chip label={`Slope ${course.slope}`} theme={resolvedTheme} />
          )}
          {course.yards && (
            <Chip label={`${course.yards.toLocaleString()} yds`} theme={resolvedTheme} />
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, theme, primary }: { label: string; theme: Theme; primary?: boolean }) {
  return (
    <span style={{
      fontSize: 11, padding: '3px 8px', borderRadius: 20,
      background: primary ? theme.accentLight : theme.surfaceAlt,
      color: primary ? theme.primary : theme.textSub,
      fontWeight: primary ? 500 : 400,
    }}>
      {label}
    </span>
  );
}
