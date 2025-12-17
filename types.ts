export type ModelMode = 'fast' | 'web' | 'deep';

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64 string
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Evidence {
  claim: string;
  sourceType: 'web' | 'pdf' | 'knowledge';
  sourceName: string;
  sourceReference: string; // URL or Page Number
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  attachments?: Attachment[];
  groundingChunks?: GroundingChunk[];
  evidence?: Evidence[];
  timestamp: number;
}

export interface ProcessingState {
  isLoading: boolean;
  statusMessage: string;
}