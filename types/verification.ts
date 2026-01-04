export interface ReferencePhoto {
  id: string;
  uri: string;
  uploadedAt: number;
}

export interface PhotoMetadata {
  timestamp: string;
  cameraType: 'front' | 'back';
  exifData?: any;
}

export interface VerificationRequest {
  id: string;
  editedPhotoUri: string;
  photoSource: 'camera' | 'library';
  referencePhotos: ReferencePhoto[];
  metadata?: PhotoMetadata;
  createdAt: number;
  status: 'pending' | 'completed';
}

export type SubjectType = 'person' | 'dog' | 'cat' | 'animal' | 'building' | 'object' | 'other';

export interface VerificationResult {
  id: string;
  requestId: string;
  credibilityScore: number;
  subjectType: SubjectType;
  subjectName?: string;
  analysis: {
    facialSimilarity: number;
    skinTexture: number;
    proportions: number;
    lighting: number;
  };
  verdict: 'authentic' | 'slightly-edited' | 'heavily-edited' | 'suspicious';
  verificationCode: string;
  deviceId: string;
  metadataValid?: boolean;
  metadataWarnings?: string[];
  description?: string;
  completedAt: number;
}

export interface VerificationHistory {
  request: VerificationRequest;
  result: VerificationResult;
}

export interface ImageSourceAnalysis {
  description: string;
  keywords: string[];
  possibleSources: string[];
  suggestions: string;
  entityInfo?: {
    type: 'person' | 'animal' | 'plant' | 'other';
    name?: string;
    introduction?: string;
  };
}

export interface ImageSourceHistory {
  id: string;
  imageUri: string;
  analysis: ImageSourceAnalysis;
  createdAt: number;
}

export interface OutfitChangeHistory {
  id: string;
  originalImageUri: string;
  resultImageUri: string;
  templateId: string;
  templateName: string;
  createdAt: number;
}