'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

interface LearningContextType {
  experienceLevel: ExperienceLevel;
  setExperienceLevel: (level: ExperienceLevel) => void;
  showGlossaryTooltips: boolean;
  setShowGlossaryTooltips: (show: boolean) => void;
  showWorstCase: boolean;
  setShowWorstCase: (show: boolean) => void;
  showPLDiagrams: boolean;
  setShowPLDiagrams: (show: boolean) => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: ReactNode }) {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [showGlossaryTooltips, setShowGlossaryTooltips] = useState(true);
  const [showWorstCase, setShowWorstCase] = useState(true);
  const [showPLDiagrams, setShowPLDiagrams] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('learningPreferences');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        if (prefs.experienceLevel) setExperienceLevel(prefs.experienceLevel);
        if (typeof prefs.showGlossaryTooltips === 'boolean') setShowGlossaryTooltips(prefs.showGlossaryTooltips);
        if (typeof prefs.showWorstCase === 'boolean') setShowWorstCase(prefs.showWorstCase);
        if (typeof prefs.showPLDiagrams === 'boolean') setShowPLDiagrams(prefs.showPLDiagrams);
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('learningPreferences', JSON.stringify({
      experienceLevel,
      showGlossaryTooltips,
      showWorstCase,
      showPLDiagrams,
    }));
  }, [experienceLevel, showGlossaryTooltips, showWorstCase, showPLDiagrams]);

  return (
    <LearningContext.Provider value={{
      experienceLevel,
      setExperienceLevel,
      showGlossaryTooltips,
      setShowGlossaryTooltips,
      showWorstCase,
      setShowWorstCase,
      showPLDiagrams,
      setShowPLDiagrams,
    }}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}

// Helper to check if we should show beginner content
export function useIsBeginner() {
  const { experienceLevel } = useLearning();
  return experienceLevel === 'beginner';
}
