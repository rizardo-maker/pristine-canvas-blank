import { createWorker, PSM } from 'tesseract.js';
import { toast } from 'sonner';

/**
 * Preprocesses an image using a canvas to improve OCR quality.
 * Applies grayscale and increases contrast.
 * @param imageFile The image file to preprocess.
 * @returns A promise that resolves with a data URL of the preprocessed image.
 */
const preprocessImage = (imageFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        // Set canvas size to image size
        canvas.width = image.width;
        canvas.height = image.height;

        // Apply filters for better OCR
        // Grayscale and contrast are effective for cleaning up images.
        ctx.filter = 'grayscale(1) contrast(150%)';
        
        // Draw the image with the filters
        ctx.drawImage(image, 0, 0);

        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = (err) => reject(err);
      if (event.target?.result) {
        image.src = event.target.result as string;
      } else {
        reject(new Error("Couldn't read file"));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(imageFile);
  });
};


/**
 * Processes an image or PDF file using Tesseract.js OCR to extract text.
 * It preprocesses images and uses a single analysis mode for reliability.
 * @param imageFile The file to process (image or PDF).
 * @param progressCallback A callback function to report OCR progress (0-100).
 * @returns The extracted text as a string, or null if an error occurs.
 */
export const processImageWithOCR = async (
  imageFile: File,
  progressCallback?: (progress: number) => void,
): Promise<string | null> => {
  try {
    let ocrInput: File | string;

    if (imageFile.type.startsWith('image/')) {
      toast.info('Preprocessing image for better accuracy...');
      ocrInput = await preprocessImage(imageFile);
      toast.success('Image preprocessed. Starting text recognition...');
    } else {
      ocrInput = imageFile;
      if (imageFile.type === 'application/pdf') {
        toast.info('Processing PDF file, this may take a while...');
      } else {
        toast.info('Processing file...');
      }
    }

    toast.info('Starting text recognition...');
    
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && progressCallback) {
          progressCallback(Math.round(m.progress * 100));
        }
      },
    });

    // Using a single, general-purpose PSM mode for improved reliability with PDFs.
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-.,: ',
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: PSM.AUTO,
    });

    const { data: { text } } = await worker.recognize(ocrInput);
    await worker.terminate();
    
    console.log('OCR text found:', text);
    toast.success('Text recognition complete.');

    return text;

  } catch (error) {
    console.error('OCR Error:', error);
    toast.error('Failed to process file with OCR. Please check the console for details.');
    return null;
  }
};
