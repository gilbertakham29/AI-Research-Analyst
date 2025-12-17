import { Attachment } from './types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const processFiles = async (files: FileList | null): Promise<Attachment[]> => {
  if (!files) return [];
  
  const attachments: Attachment[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Only accept PDFs for this research analyst context, or text/images if desired.
    // The prompt specificially mentioned PDF reading.
    if (file.type === 'application/pdf') {
      try {
        const base64Data = await fileToBase64(file);
        attachments.push({
          name: file.name,
          mimeType: file.type,
          data: base64Data,
        });
      } catch (err) {
        console.error(`Failed to process file ${file.name}`, err);
      }
    }
  }
  return attachments;
};
// utils/env.ts
// This handles both Node.js and Vite environments

const getApiKey = (): string => {
  // Check for Vite environment first (client-side)
  if (import.meta.env) {
    return (import.meta as any).env?.API_KEY || '';
  }
  
  // Fallback for Node.js/SSR environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_API_KEY || '';
  }
  
  return '';
};

export { getApiKey };
