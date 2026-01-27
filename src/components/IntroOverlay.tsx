'use client'

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "tally_intro_seen";

// Hardcoded English text for intro (no i18n - shows before language selection)
const slideTexts = [
  {
    title: 'Record money as it moves',
    body: 'Add sales and expenses as they happen. Each entry keeps your notebook up to date.',
  },
  {
    title: 'See where you stand today',
    body: 'Check cash in cash out and balance at a glance. No calculations needed.',
  },
  {
    title: 'Keep track of what is owed',
    body: 'See who owes you and what you need to pay. Nothing gets missed.',
  },
];

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

// Visual block for slide 3 - Obligations
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

function renderVisualBlock(visual: "recording" | "summary" | "obligations") {
  switch (visual) {
    case "recording":
      return <RecordingVisual />;
    case "summary":
      return <SummaryVisual />;
    case "obligations":
      return <ObligationsVisual />;
  }
}

interface IntroOverlayProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function IntroOverlay({ forceOpen, onClose }: IntroOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentSlide(0);
    }
  }, [forceOpen]);

  const handleClose = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

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
  const currentText = slideTexts[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed background */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-background rounded-3xl w-full max-w-[420px] flex flex-col overflow-hidden animate-scale-in"
        style={{ height: "62vh", maxHeight: "65vh", minHeight: "55vh" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent active:scale-95 transition-all"
          aria-label="Close intro"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Content - centered with visual block */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
          {/* Visual block */}
          {renderVisualBlock(slides[currentSlide].visual)}
          
          {/* Text block */}
          <div className="text-center space-y-2">
            <h2 className="text-base font-semibold text-foreground leading-snug">
              {currentText.title}
            </h2>
            <p className="text-muted-foreground text-center text-sm leading-relaxed max-w-[260px]">
              {currentText.body}
            </p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="px-6 pb-6 space-y-4">
          {/* Dot indicators - subtle */}
          <div className="flex justify-center gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  index === currentSlide
                    ? "bg-foreground/60 w-4"
                    : "bg-muted-foreground/20"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleNext}
              className="w-full tally-button-primary"
            >
              {isLastSlide ? 'Get Started' : 'Next'}
            </Button>
            
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm font-medium text-muted-foreground py-2 hover:text-foreground transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to control intro overlay from other components
export function useIntroOverlay() {
  const [showIntro, setShowIntro] = useState(false);

  const openIntro = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowIntro(true);
  };

  const closeIntro = () => {
    setShowIntro(false);
  };

  return { showIntro, openIntro, closeIntro };
}
