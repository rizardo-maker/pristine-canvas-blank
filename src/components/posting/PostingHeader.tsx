
import React from 'react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileScan, FileText } from 'lucide-react';
import { useVoiceAction } from '@/hooks/useVoiceAction';
import { toast } from 'sonner';

interface PostingHeaderProps {
  onOcrImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPdfImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isOcrRunning: boolean;
  ocrProgress: number;
  ocrFileInputRef: React.RefObject<HTMLInputElement>;
  pdfFileInputRef: React.RefObject<HTMLInputElement>;
}

const PostingHeader: React.FC<PostingHeaderProps> = ({
  onOcrImport,
  onPdfImport,
  isOcrRunning,
  ocrProgress,
  ocrFileInputRef,
  pdfFileInputRef,
}) => {
  useVoiceAction(
    ['scan image', 'scan from image', 'import from image'],
    () => {
      if (!isOcrRunning && ocrFileInputRef.current) {
        toast.info('Activating image scan by voice...');
        ocrFileInputRef.current.click();
      }
    },
    !isOcrRunning
  );

  useVoiceAction(
    ['import pdf', 'scan from pdf', 'import from pdf'],
    () => {
      if (!isOcrRunning && pdfFileInputRef.current) {
        toast.info('Activating PDF import by voice...');
        pdfFileInputRef.current.click();
      }
    },
    !isOcrRunning
  );

  return (
    <CardHeader>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            Enter payments manually or import from an image or PDF.
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="file"
            ref={ocrFileInputRef}
            onChange={onOcrImport}
            className="hidden"
            accept="image/*"
          />
          <input
            type="file"
            ref={pdfFileInputRef}
            onChange={onPdfImport}
            className="hidden"
            accept="application/pdf"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => ocrFileInputRef.current?.click()}
            disabled={isOcrRunning}
          >
            {isOcrRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Processing... ({ocrProgress}%)
              </>
            ) : (
              <>
                <FileScan className="mr-2 h-4 w-4" />
                Scan from Image
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => pdfFileInputRef.current?.click()}
            disabled={isOcrRunning}
          >
            {isOcrRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Processing... ({ocrProgress}%)
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Import from PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};

export default PostingHeader;
