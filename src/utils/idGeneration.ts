
// Robust ID generation utility
let idCounter = 0;

export const generateUniquePaymentId = (): string => {
  idCounter++;
  const timestamp = Date.now();
  const randomComponent = Math.random().toString(36).substring(2, 9);
  const counter = idCounter.toString().padStart(4, '0');
  
  return `payment_${timestamp}_${counter}_${randomComponent}`;
};

export const generateUniqueBatchId = (): string => {
  const timestamp = Date.now();
  const randomComponent = Math.random().toString(36).substring(2, 9);
  
  return `batch_${timestamp}_${randomComponent}`;
};

// Reset counter for testing purposes
export const resetIdCounter = () => {
  idCounter = 0;
};
