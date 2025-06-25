
import { useEffect, useRef } from 'react';
import { useSharedVoiceNavigation } from '@/context/VoiceNavigationContext';

/**
 * A hook to perform an action based on a voice command transcript.
 * It listens for new transcripts from the voice navigation context
 * and fires a callback if a command is detected.
 * 
 * @param commands - A string or an array of strings representing voice commands.
 * @param callback - The function to execute when a command is matched. It receives the full transcript.
 * @param enabled - A boolean to enable or disable the hook. Defaults to true.
 */
export const useVoiceAction = (
  commands: string | string[],
  callback: (transcript: string) => void,
  enabled: boolean = true
) => {
  const { transcript, isListening } = useSharedVoiceNavigation();
  const lastTranscriptRef = useRef('');

  const commandList = Array.isArray(commands) ? commands : [commands];

  useEffect(() => {
    if (enabled && isListening && transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      
      for (const command of commandList) {
        if (transcript.toLowerCase().startsWith(command.toLowerCase())) {
          callback(transcript);
          // Once a command is matched and action is fired, we break.
          break; 
        }
      }
    }
  }, [transcript, isListening, commandList, callback, enabled]);
};
