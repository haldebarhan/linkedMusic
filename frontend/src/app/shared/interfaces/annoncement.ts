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

export interface AnnouncementSearchParams {
  categorySlug?: string;
  search?: string;
  country?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  fieldFilters?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
