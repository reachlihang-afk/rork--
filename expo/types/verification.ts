export interface OutfitChangeHistory {
  id: string;
  originalImageUri: string;
  resultImageUri: string;
  templateId: string;
  templateName: string;
  createdAt: number;
  allowSquarePublish?: boolean; // 是否允许发布到广场
  isPublishedToSquare?: boolean; // 是否已发布到广场
}
