
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useVoiceNavigation } from '@/hooks/useVoiceNavigation';

interface VoiceCommand {
  commands: string[];
  path: string;
}

interface VoiceNavigationContextType {
  isListening: boolean;
  transcript: string;
  toggleListening: () => void;
  isHelpOpen: boolean;
  setHelpOpen: (isOpen: boolean) => void;
}

const VoiceNavigationContext = createContext<VoiceNavigationContextType | undefined>(undefined);

export const VoiceNavigationProvider: React.FC<{ children: React.ReactNode; routes: VoiceCommand[] }> = ({ children, routes }) => {
  const voiceNavigation = useVoiceNavigation({ routes });
  const [isHelpOpen, setHelpOpen] = useState(false);

  const value = useMemo(() => ({
    isListening: voiceNavigation.isListening,
    transcript: voiceNavigation.transcript,
    toggleListening: voiceNavigation.toggleListening,
    isHelpOpen,
    setHelpOpen,
  }), [voiceNavigation.isListening, voiceNavigation.transcript, voiceNavigation.toggleListening, isHelpOpen]);

  return (
    <VoiceNavigationContext.Provider value={value}>
      {children}
    </VoiceNavigationContext.Provider>
  );
};

export const useSharedVoiceNavigation = () => {
  const context = useContext(VoiceNavigationContext);
  if (context === undefined) {
    throw new Error('useSharedVoiceNavigation must be used within a VoiceNavigationProvider');
  }
  return context;
};
