
// Enhanced ID generation utility with sequential tracking
let idCounter = 0;
let lastTimestamp = 0;

export const generateUniquePaymentId = (): string => {
  const currentTimestamp = Date.now();
  
  // Reset counter if we're in a new millisecond
  if (currentTimestamp !== lastTimestamp) {
    idCounter = 0;
    lastTimestamp = currentTimestamp;
  } else {
    idCounter++;
  }
  
  const randomComponent = Math.random().toString(36).substring(2, 9);
  const counter = idCounter.toString().padStart(4, '0');
  const sequentialId = (currentTimestamp * 10000 + idCounter).toString();
  
  return `payment_${sequentialId}_${randomComponent}`;
};

export const generateUniqueBatchId = (): string => {
  const timestamp = Date.now();
  const randomComponent = Math.random().toString(36).substring(2, 9);
  const sessionId = Math.random().toString(36).substring(2, 5);
  
  return `batch_${timestamp}_${sessionId}_${randomComponent}`;
};

// Generate a series of unique IDs for batch operations
export const generateBatchPaymentIds = (count: number): string[] => {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(generateUniquePaymentId());
  }
  return ids;
};

// Reset counter for testing purposes
export const resetIdCounter = () => {
  idCounter = 0;
  lastTimestamp = 0;
};

// Validate ID uniqueness in a batch
export const validateIdUniqueness = (ids: string[]): boolean => {
  const uniqueIds = new Set(ids);
  return uniqueIds.size === ids.length;
};
