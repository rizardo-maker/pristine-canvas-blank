
export interface VoiceAction {
  phrases: string[];
  description: string;
}

export interface VoiceActionCategory {
  category: string;
  commands: VoiceAction[];
}

export const voiceActionCommands: VoiceActionCategory[] = [
  {
    category: 'General Actions',
    commands: [
      {
        phrases: ['help', 'show help', 'open help', 'voice commands'],
        description: 'Opens the voice command help dialog.',
      },
    ],
  },
  {
    category: 'Posting Page Actions',
    commands: [
      {
        phrases: ['scan image', 'scan from image', 'import from image'],
        description: 'Opens file dialog to import an image for OCR.',
      },
      {
        phrases: ['import pdf', 'scan from pdf', 'import from pdf'],
        description: 'Opens file dialog to import a PDF for OCR.',
      },
    ],
  },
];
