
// Enhanced ID generation utility to prevent collisions
let idCounter = 0;

export const generateUniqueId = (): string => {
  const timestamp = Date.now();
  const counter = ++idCounter;
  const random = Math.floor(Math.random() * 1000);
  return `${timestamp}-${counter}-${random}`;
};

export const generatePaymentBatch = (count: number): string[] => {
  return Array.from({ length: count }, () => generateUniqueId());
};

// Reset counter if it gets too large
if (idCounter > 999999) {
  idCounter = 0;
}
