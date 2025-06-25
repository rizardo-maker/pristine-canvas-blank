
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { voiceNavRoutes } from '@/config/voice-nav-routes';
import { voiceActionCommands } from '@/config/voice-action-commands';
import { Mic, Speech, HelpCircle } from 'lucide-react';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Speech className="h-6 w-6" />
            Voice Navigation Help
          </DialogTitle>
          <DialogDescription>
            Use voice commands to navigate the application or perform actions.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" /> How to Use
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground pl-2">
              <li>Click the Microphone button to start listening.</li>
              <li>When the button is pulsing or red, the app is listening for your command.</li>
              <li>Clearly say one of the commands listed below.</li>
              <li>The app will perform the action and may stop listening.</li>
              <li>Click the button again to stop listening manually.</li>
            </ol>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" /> Available Navigation Commands
            </h3>
            <p className="text-sm text-muted-foreground">
              Say any of these phrases to navigate. For example, "go to dashboard".
            </p>
            <div className="max-h-60 overflow-y-auto rounded-md border p-4 space-y-2 bg-muted/50">
              {voiceNavRoutes.map((route) => (
                <div key={route.path}>
                  <p className="font-medium capitalize text-primary">
                    Go to {route.path.replace(/[\/-]/g, ' ')}
                  </p>
                  <div className="pl-4 text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
                    {route.commands.map((command) => (
                      <code key={command} className="px-1.5 py-0.5 bg-background border rounded-sm text-xs">
                        "{command}"
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" /> Available Action Commands
            </h3>
            <p className="text-sm text-muted-foreground">
              Say these phrases to perform actions on certain pages.
            </p>
            <div className="max-h-60 overflow-y-auto rounded-md border p-4 space-y-4 bg-muted/50">
              {voiceActionCommands.map((category) => (
                <div key={category.category}>
                  <h4 className="font-medium text-sm text-foreground mb-2">{category.category}</h4>
                  <div className="space-y-2 pl-2">
                  {category.commands.map((command) => (
                    <div key={command.description}>
                      <p className="font-medium text-primary text-sm">
                        {command.description}
                      </p>
                      <div className="pl-4 text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
                        {command.phrases.map((phrase) => (
                          <code key={phrase} className="px-1.5 py-0.5 bg-background border rounded-sm text-xs">
                            "{phrase}"
                          </code>
                        ))}
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
