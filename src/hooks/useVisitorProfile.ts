import { useState, useEffect, useCallback, useMemo } from 'react';

export type VisitorProfile = 'buyer' | 'interested' | 'curious' | 'problem' | 'owner' | 'beginner';

interface ProfileSignals {
  source: string;
  referrer: string;
  entryKeyword: string;
  entryPage: string;
  device: string;
  timeOnSite: number;
  pagesViewed: number;
}

const PROFILE_KEY = 'xlata_visitor_profile';
const SESSION_KEY = 'xlata_session';

// Keywords that signal intent
const BUYER_KEYWORDS = ['sistema', 'software', 'melhor', 'comprar', 'preço sistema', 'teste grátis', 'plano'];
const PROBLEM_KEYWORDS = ['prejuízo', 'perda', 'erro', 'desorganizado', 'problema', 'resolver', 'como evitar'];
const OWNER_KEYWORDS = ['ferro velho', 'depósito', 'sucateiro', 'reciclagem', 'dono'];
const BEGINNER_KEYWORDS = ['como abrir', 'começar', 'iniciante', 'primeiro', 'montar'];

function detectProfile(signals: ProfileSignals): VisitorProfile {
  const { referrer, entryKeyword, entryPage, timeOnSite, pagesViewed } = signals;
  const kw = entryKeyword.toLowerCase();
  const page = entryPage.toLowerCase();

  // Check keyword signals first (strongest signal)
  if (BUYER_KEYWORDS.some(b => kw.includes(b) || page.includes(b))) return 'buyer';
  if (PROBLEM_KEYWORDS.some(p => kw.includes(p) || page.includes(p))) return 'problem';
  if (BEGINNER_KEYWORDS.some(b => kw.includes(b) || page.includes(b))) return 'beginner';
  if (OWNER_KEYWORDS.some(o => kw.includes(o) || page.includes(o))) return 'owner';

  // Behavioral signals
  if (pagesViewed >= 3 && timeOnSite > 120) return 'interested';
  if (referrer.includes('google') && kw.includes('preço')) return 'buyer';
  if (referrer.includes('google')) return 'interested';

  return 'curious';
}

export function useVisitorProfile() {
  const [profile, setProfile] = useState<VisitorProfile>(() => {
    try {
      return (localStorage.getItem(PROFILE_KEY) as VisitorProfile) || 'curious';
    } catch {
      return 'curious';
    }
  });

  const [sessionId] = useState(() => {
    try {
      const existing = sessionStorage.getItem(SESSION_KEY);
      if (existing) return existing;
      const id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
      return id;
    } catch {
      return 'unknown';
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const signals: ProfileSignals = {
      source: params.get('utm_source') || 'direct',
      referrer: document.referrer || '',
      entryKeyword: params.get('q') || params.get('utm_term') || window.location.pathname,
      entryPage: window.location.pathname,
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      timeOnSite: 0,
      pagesViewed: 1,
    };

    const detected = detectProfile(signals);
    setProfile(detected);
    try { localStorage.setItem(PROFILE_KEY, detected); } catch {}
  }, []);

  // Re-evaluate after time on site
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentProfile = localStorage.getItem(PROFILE_KEY) as VisitorProfile;
      // If still curious after 60s, upgrade to interested
      if (currentProfile === 'curious') {
        setProfile('interested');
        try { localStorage.setItem(PROFILE_KEY, 'interested'); } catch {}
      }
    }, 60000);
    return () => clearTimeout(timer);
  }, []);

  return { profile, sessionId };
}
