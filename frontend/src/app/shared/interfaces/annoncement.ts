export interface Announcement {
  id: number;
  title: string;
  description: string;
  ownerId: number;
  images: string[];
  serviceTypeId: number;
  data: any;
  isPublished: boolean;
  isHighlighted: boolean;
  status: string;
  price?: number;
  location?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}
