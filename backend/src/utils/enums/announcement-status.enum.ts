export enum AnnouncementStatus {
  PUBLISHED = "PUBLISHED",
  DRAFT = "DRAFT",
  ARCHIVED = "ARCHIVED",
  PENDING_APPROVAL = "PENDING_APPROVAL",
}

export const CHANGEABLE_STATUSES = [
  AnnouncementStatus.PUBLISHED,
  AnnouncementStatus.DRAFT,
  AnnouncementStatus.ARCHIVED,
] as const;

export type ChangeableStatus = (typeof CHANGEABLE_STATUSES)[number];
