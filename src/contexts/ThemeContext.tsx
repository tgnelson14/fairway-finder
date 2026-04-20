import { createContext, useContext, useState, type ReactNode } from 'react';

export type ThemeName = 'daylight' | 'dusk' | 'sport';

export interface Theme {
  name: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSub: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  danger: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  daylight: {
    name: 'Daylight',
    bg: '#F7F5F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F0EDE6',
    border: '#E2DDD4',
    text: '#1A1A18',
    textSub: '#6B6860',
    textMuted: '#A09D96',
    primary: '#1B3A2D',
    primaryLight: '#2E5C45',
    accent: '#C4973F',
    accentLight: '#F0E6CD',
    danger: '#C0392B',
  },
  dusk: {
    name: 'Dusk',
    bg: '#0E1410',
    surface: '#161E18',
    surfaceAlt: '#1C2820',
    border: '#2A3830',
    text: '#F2EDE4',
    textSub: '#A09A8E',
    textMuted: '#5A5750',
    primary: '#C4973F',
    primaryLight: '#D4A84F',
    accent: '#6BA882',
    accentLight: '#1C2820',
    danger: '#E06B55',
  },
  sport: {
    name: 'Sport',
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#F4F4F4',
    border: '#E8E8E8',
    text: '#0A0A0A',
    textSub: '#555555',
    textMuted: '#999999',
    primary: '#0A0A0A',
    primaryLight: '#333333',
    accent: '#1DB954',
    accentLight: '#E8F9EF',
    danger: '#E03030',
  },
};

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('daylight');
  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeName], themeName, setTheme: setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
