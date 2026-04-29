import React, { createContext, useContext, useState } from 'react';

// ─── Dark Theme ────────────────────────────────────────────────
const darkTheme = {
  name: 'dark',
  // Backgrounds
  bg: '#010C1A',
  bgCard: '#0a1628',
  bgElevated: '#0f1d32',
  bgModal: '#020617',
  bgInput: 'rgba(0,0,0,0.4)',
  bgGlass: 'rgba(14, 165, 233, 0.06)',
  bgGlassStrong: 'rgba(14, 165, 233, 0.12)',
  // Surfaces
  surface: '#111b2e',
  surfaceBorder: '#1e293b',
  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textInverse: '#0f172a',
  // Accent — Blue
  accent: '#0ea5e9',
  accentDark: '#0284c7',
  accentGlow: 'rgba(14, 165, 233, 0.4)',
  accentSoft: 'rgba(14, 165, 233, 0.1)',
  accentBorder: 'rgba(14, 165, 233, 0.3)',
  // Accent — Green (for resolved items)
  green: '#10b981',
  greenSoft: 'rgba(16, 185, 129, 0.1)',
  greenBorder: 'rgba(16, 185, 129, 0.3)',
  greenGlow: 'rgba(16, 185, 129, 0.4)',
  // Accent — Red (for lost items)
  red: '#e11d48',
  redSoft: 'rgba(225, 29, 72, 0.15)',
  // Accent — Cyan (role tags)
  cyan: '#38bdf8',
  cyanSoft: 'rgba(14, 165, 233, 0.2)',
  cyanBorder: 'rgba(14, 165, 233, 0.3)',
  // Gradients
  gradientCard: ['rgba(14, 165, 233, 0.08)', 'rgba(2, 6, 23, 0.9)'],
  gradientCardGreen: ['rgba(16, 185, 129, 0.08)', 'rgba(2, 6, 23, 0.9)'],
  gradientAccent: ['#0ea5e9', '#0284c7'],
  gradientModal: ['#020617', '#011224'],
  gradientBg: ['#010C1A', '#020617'],
  // Shadows
  shadowColor: '#000',
  shadowAccent: '#0ea5e9',
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  cardShadow3D: {
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  // Glow orb
  glowColor: '#0ea5e9',
  glowOpacity: 0.12,
  // StatusBar
  statusBar: 'light-content',
};

// ─── Light Theme ───────────────────────────────────────────────
const lightTheme = {
  name: 'light',
  // Backgrounds
  bg: '#f0f4f8',
  bgCard: '#ffffff',
  bgElevated: '#f8fafc',
  bgModal: '#ffffff',
  bgInput: 'rgba(0,0,0,0.03)',
  bgGlass: 'rgba(14, 165, 233, 0.04)',
  bgGlassStrong: 'rgba(14, 165, 233, 0.08)',
  // Surfaces
  surface: '#ffffff',
  surfaceBorder: '#e2e8f0',
  // Text
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#f8fafc',
  // Accent — Blue
  accent: '#0284c7',
  accentDark: '#0369a1',
  accentGlow: 'rgba(14, 165, 233, 0.25)',
  accentSoft: 'rgba(14, 165, 233, 0.08)',
  accentBorder: 'rgba(14, 165, 233, 0.25)',
  // Accent — Green
  green: '#059669',
  greenSoft: 'rgba(5, 150, 105, 0.08)',
  greenBorder: 'rgba(5, 150, 105, 0.25)',
  greenGlow: 'rgba(5, 150, 105, 0.3)',
  // Accent — Red
  red: '#dc2626',
  redSoft: 'rgba(220, 38, 38, 0.1)',
  // Accent — Cyan
  cyan: '#0284c7',
  cyanSoft: 'rgba(2, 132, 199, 0.1)',
  cyanBorder: 'rgba(2, 132, 199, 0.2)',
  // Gradients
  gradientCard: ['rgba(14, 165, 233, 0.04)', 'rgba(255, 255, 255, 0.95)'],
  gradientCardGreen: ['rgba(5, 150, 105, 0.04)', 'rgba(255, 255, 255, 0.95)'],
  gradientAccent: ['#0ea5e9', '#0284c7'],
  gradientModal: ['#ffffff', '#f8fafc'],
  gradientBg: ['#f0f4f8', '#e2e8f0'],
  // Shadows
  shadowColor: '#94a3b8',
  shadowAccent: '#0ea5e9',
  cardShadow: {
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardShadow3D: {
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  // Glow orb
  glowColor: '#0ea5e9',
  glowOpacity: 0.06,
  // StatusBar
  statusBar: 'dark-content',
};

// ─── Context ───────────────────────────────────────────────────
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true); // Default = dark

  const theme = isDark ? darkTheme : lightTheme;
  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

export default ThemeContext;
