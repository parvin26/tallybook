'use client'

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { supabase } from "@/lib/supabase/supabaseClient";
import { LANGUAGES } from "@/lib/constants";

const slides = [
  {
    id: 1,
    visual: "recording" as const,
  },
  {
    id: 2,
    visual: "summary" as const,
  },
  {
    id: 3,
    visual: "obligations" as const,
  },
  {
    id: 4,
    visual: "patterns" as const,
  },
  {
    id: 5,
    visual: "start" as const,
  },
];

// Visual block for slide 1 - Recording action
function RecordingVisual() {
  return (
    <div className="w-full max-w-[280px] space-y-4">
      {/* Mock input field - matches Record Expense input styling exactly */}
      <div className="border-2 border-border rounded-xl h-16 flex items-center px-4 bg-card">
        <span className="text-lg font-medium text-muted-foreground">RM</span>
        <span className="text-2xl font-bold text-muted-foreground/50 ml-auto">0.00</span>
      </div>
      
      {/* Pill buttons - visual only */}
      <div className="flex gap-2 justify-center">
        <span className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">
          Sales
        </span>
        <span className="px-4 py-2 rounded-xl bg-secondary/10 text-secondary text-sm font-medium">
          Expenses
        </span>
      </div>
    </div>
  );
}

// Visual block for slide 2 - Daily summary
function SummaryVisual() {
  return (
    <div className="w-full max-w-[280px] rounded-2xl border border-border bg-card p-4">
      <div className="space-y-0">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-muted-foreground">Cash in</span>
          <span className="text-sm font-medium text-primary">RM ---</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-muted-foreground">Cash out</span>
          <span className="text-sm font-medium text-secondary">RM ---</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-muted-foreground">Balance today</span>
          <span className="text-sm font-medium text-foreground">RM ---</span>
        </div>
      </div>
    </div>
  );
}

// Visual block for slide 3 - Daily clarity
function ObligationsVisual() {
  return (
    <div className="w-full max-w-[280px] rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-sm text-foreground">You are owed</span>
      </div>
      <div className="px-4 py-3">
        <span className="text-sm text-foreground">You need to pay</span>
      </div>
    </div>
  );
}

// Visual block for slide 4 - Patterns
function PatternsVisual() {
  return (
    <div className="w-full max-w-[280px] rounded-2xl border border-border bg-card p-4">
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground mb-2">Most days you spend on</div>
        <div className="h-3 bg-secondary/20 rounded-full" />
        <div className="h-3 bg-secondary/30 rounded-full w-4/5" />
        <div className="h-3 bg-secondary/20 rounded-full w-3/5" />
      </div>
    </div>
  );
}

// Visual block for slide 5 - Start: neutral preview container (not a CTA)
function StartVisual() {
  return (
    <div className="w-full max-w-[280px] cursor-default select-none">
      {/* Informational card: "this is what you will see" — no action, no button styling */}
      <div className="w-full rounded-xl border border-gray-200 bg-muted/60 px-4 py-4 text-left">
        <p className="text-sm font-semibold text-foreground">Your starting point</p>
        <p className="text-xs text-muted-foreground mt-1">Start recording today</p>
        {/* Neutral preview: labels only, no numbers or currency (safe for all countries) */}
        <div className="mt-4 space-y-2 border-t border-gray-200/80 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Cash in</span>
            <span className="h-3 w-12 rounded bg-gray-200/80" aria-hidden />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Cash out</span>
            <span className="h-3 w-12 rounded bg-gray-200/80" aria-hidden />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Balance</span>
            <span className="h-3 w-12 rounded bg-gray-200/80" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

function renderVisualBlock(visual: "recording" | "summary" | "obligations" | "patterns" | "start") {
  switch (visual) {
    case "recording":
      return <RecordingVisual />;
    case "summary":
      return <SummaryVisual />;
    case "obligations":
      return <ObligationsVisual />;
    case "patterns":
      return <PatternsVisual />;
    case "start":
      return <StartVisual />;
  }
}

interface IntroOverlayProps {
  forceOpen?: boolean;
  /** First-time handoff: set intro_seen, save language, then onClose. Replay: just onClose. */
  isFirstTime?: boolean;
  onClose?: () => void;
}

export function IntroOverlay({ forceOpen, isFirstTime = false, onClose }: IntroOverlayProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const trackingSent = useRef(false);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];
  const displayCode = currentLang.shortCode;

  useEffect(() => {
    if (!langMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [langMenuOpen]);

  const minSwipeDistance = 50;

  // Soft language detection on mount (first-time only): ignore tally-language; use navigator only.
  useEffect(() => {
    if (typeof window === 'undefined' || !isFirstTime) return;
    const lang = navigator.language || '';
    if (lang === 'ms' || lang === 'ms-MY' || lang.startsWith('ms')) {
      i18n.changeLanguage('bm');
    } else {
      i18n.changeLanguage('en');
    }
  }, [i18n, isFirstTime]);

  // Session Start tracking: log once on mount to analytics_visits (Malaysia, Sierra Leone, Timor Leste, Kenya).
  useEffect(() => {
    if (typeof window === 'undefined' || trackingSent.current) return;
    trackingSent.current = true;
    const browserLang = navigator.language || null;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    try {
      supabase.from('analytics_visits').insert({
        ip_hash: null,
        timezone,
        browser_lang: browserLang,
      }).then(({ error }) => {
        if (error) console.warn('[Intro] analytics_visits insert failed:', error.message);
      });
    } catch (_) {
      // Supabase may be unavailable; fail softly
    }
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentSlide(0);
    } else {
      if (typeof window !== 'undefined') {
        const introSeen = localStorage.getItem(STORAGE_KEYS.INTRO_SEEN);
        if (!introSeen) {
          setIsOpen(true);
          setCurrentSlide(0);
        } else {
          setIsOpen(false);
        }
      }
    }
  }, [forceOpen]);

  const handleClose = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.INTRO_SEEN, 'true');
      if (isFirstTime) {
        const lang = i18n.language && ['en', 'bm', 'krio'].includes(i18n.language) ? i18n.language : 'en';
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
      }
      onClose?.();
      return;
    }
    setIsOpen(false);
    onClose?.();
  }, [onClose, isFirstTime, i18n.language]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  if (!isOpen) return null;

  const isLastSlide = currentSlide === slides.length - 1;
  const slideNumber = currentSlide + 1;
  
  // Use i18n with fallbacks; one benefit word per heading highlighted in green (text-primary)
  const currentTitle = t(`intro.slide${slideNumber}.title`, {
    defaultValue: slideNumber === 1 ? 'A simple place to record today' :
                  slideNumber === 2 ? 'No setup required' :
                  slideNumber === 3 ? 'See your day clearly' :
                  slideNumber === 4 ? 'Things start to make sense' :
                  'Start where you are'
  });

  const currentBodyRaw = t(`intro.slide${slideNumber}.body`, {
    defaultValue: slideNumber === 1 ? 'Write down what you sell and what you spend\nAs your day goes on' :
                  slideNumber === 2 ? 'No forms\nNo categories to learn\nJust open and record' :
                  slideNumber === 3 ? 'At the end of the day, you know what happened\nWithout guessing' :
                  slideNumber === 4 ? 'After a few days, patterns appear\nWhere money comes in\nWhere it goes' :
                  'Use it daily\nOr only when you can\nTALLY works with you'
  });
  const bodyLines = currentBodyRaw.split('\n').filter(Boolean);

  // Green highlight: one keyword per heading (benefit/action word only)
  const highlightWordBySlide: Record<number, string> = {
    1: 'record',
    2: 'setup',
    3: 'clearly',
    4: 'sense',
    5: 'Start',
  };

  const renderHighlightedTitle = (slideIndex: number, title: string) => {
    const word = highlightWordBySlide[slideIndex];
    if (!word) return title;

    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
    const parts = title.split(regex);

    return parts.map((part, idx) => {
      if (part.toLowerCase() === word.toLowerCase()) {
        return (
          <span key={idx} className="text-primary">
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Dimmed background — click to close */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal: h-screen flex-col, cream background */}
      <div
        className="relative bg-[#F9F9F7] rounded-3xl w-full max-w-[420px] flex flex-col h-screen max-h-[100dvh] overflow-hidden animate-scale-in"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Top: Close + Language Switcher (top right, floating) */}
        <div className="flex-shrink-0 flex items-center justify-end pt-6 px-6">
          <button
            onClick={handleClose}
            className="absolute top-6 left-6 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white active:scale-95 transition-all shadow-sm"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((o) => !o)}
              className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white/90 px-2.5 py-1.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-white"
              aria-label="Language"
              aria-expanded={langMenuOpen}
            >
              <span>{displayCode}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-gray-500 transition-transform", langMenuOpen && "rotate-180")} />
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {LANGUAGES.map((lang) => {
                  const isActive = lang.status === 'active';
                  const isCurrent = i18n.language === lang.code;
                  return (
                    <div key={lang.code} className="px-3 py-2">
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            i18n.changeLanguage(lang.code);
                            setLangMenuOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg py-1 text-left",
                            isCurrent ? "text-foreground font-semibold" : "text-foreground hover:bg-gray-100"
                          )}
                        >
                          <span className="font-bold text-sm shrink-0">{lang.shortCode}</span>
                          <span className="text-xs text-gray-600 truncate">{lang.name}</span>
                        </button>
                      ) : (
                        <div className="flex w-full items-center gap-2 rounded-lg py-1 text-left">
                          <span className="font-bold text-sm text-gray-400 shrink-0">{lang.shortCode}</span>
                          <span className="text-xs text-gray-400 truncate flex-1">{lang.name}</span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 shrink-0">Soon</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Middle (flex-1): Text + Mock Card — vertically centered */}
        <div className="flex-1 flex flex-col justify-center items-center min-h-0 px-6">
          <div className="flex flex-col items-center w-full space-y-6">
            {/* Text block */}
            <div className="text-center space-y-3 w-full">
              <h2 className="text-3xl font-bold leading-tight text-emerald-950">
                {renderHighlightedTitle(slideNumber, currentTitle)}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[320px] mx-auto">
                {bodyLines.map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </p>
            </div>
            {/* Visual mock card */}
            <div className="flex items-center justify-center w-full">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-4 w-full max-w-[280px]">
                {renderVisualBlock(slides[currentSlide].visual)}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Footer (padding bottom) */}
        <div className="flex-shrink-0 px-6 pb-6 pt-4 space-y-4">
          <div className="flex justify-center gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  index === currentSlide
                    ? "bg-emerald-600 w-4"
                    : "bg-gray-300"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <Button
            onClick={handleNext}
            variant="default"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12"
          >
            {isLastSlide
              ? t('intro.actions.getStarted', { defaultValue: 'Get started' })
              : t('intro.actions.next', { defaultValue: 'Next' })}
          </Button>
          {isLastSlide && (
            <button
              type="button"
              onClick={handleNext}
              className="text-xs text-center text-gray-500 hover:text-gray-700 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded px-1 py-0.5"
            >
              {t('intro.actions.startRecordingToday', { defaultValue: 'Start recording today' })}
            </button>
          )}
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-sm text-gray-500 hover:text-gray-700 hover:bg-transparent"
          >
            {t('intro.actions.skip', { defaultValue: 'Skip' })}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook to control intro overlay from other components
export function useIntroOverlay() {
  const [showIntro, setShowIntro] = useState(false);

  const openIntro = () => {
    localStorage.removeItem(STORAGE_KEYS.INTRO_SEEN);
    setShowIntro(true);
  };

  const closeIntro = () => {
    setShowIntro(false);
  };

  return { showIntro, openIntro, closeIntro };
}
