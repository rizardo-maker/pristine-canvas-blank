
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface VoiceCommand {
  commands: string[];
  path: string;
}

interface UseVoiceNavigationProps {
  routes: VoiceCommand[];
}

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useVoiceNavigation = ({ routes }: UseVoiceNavigationProps) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Ref to hold the latest listening state to avoid stale closures in callbacks
  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  useEffect(() => {
    if (!SpeechRecognition) {
      console.error('Speech Recognition API is not supported in this browser.');
      toast.error('Voice navigation is not supported on this browser.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const command = lastResult[0].transcript.trim().toLowerCase();
      setTranscript(command);

      for (const route of routes) {
        if (route.commands.some(c => command.startsWith(c))) {
          toast.success(`Navigating to ${route.path}...`);
          navigate(route.path);
          
          // Manually update ref before stopping to prevent restart
          isListeningRef.current = false; 
          recognition.stop();
          setIsListening(false);
          return;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast.error(`Voice recognition error: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      // Use ref to get the latest isListening state.
      // This prevents restarting if we stopped intentionally.
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to restart speech recognition:", e);
          setIsListening(false);
        }
      }
    };

    return () => {
      if (recognitionRef.current) {
        // Prevent onend from firing on unmount/re-render
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, [routes, navigate]); // isListening is removed to prevent re-creating recognition instance

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      toast.info('Voice navigation stopped.');
    } else {
      try {
        recognitionRef.current.start();
        toast.info('Voice navigation started. Try "Go to dashboard".');
      } catch (error) {
         console.error('Could not start recognition:', error);
         toast.error('Could not start voice navigation.');
      }
    }
    setIsListening(prev => !prev);
  }, [isListening]);

  return { isListening, transcript, toggleListening };
};
