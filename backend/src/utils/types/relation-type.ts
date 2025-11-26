import {
  Category,
  Field,
  FieldOption,
  Announcement,
  AnnFieldValue,
  User,
  MusicStyle,
  Instrument,
  Language,
  Software,
  FieldInputType,
} from "@prisma/client";

export type CategoryWithFields = {
  category: Category;
  categoryFields: Array<{
    fields: Field & {
      options: FieldOption[];
    };
    required: boolean;
    visibleInForm: boolean;
    visibleInFilter: boolean;
    order: number;
  }>;
};

export type FieldWithOptions = Field & {
  options?: FieldOption[];
};

export type AnnouncementWithDetails = Announcement & {
  category: Category;
  user: Partial<User>;
  _count: any;
  fieldValues: Array<
    AnnFieldValue & {
      field: Field;
      options?: Array<{
        option: FieldOption;
      }>;
    }
  >;
};

export type FieldValueInput = {
  fieldId: number;
  valueText?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueDate?: Date;
  valueJson?: any;
  optionIds?: number[]; // Pour MULTISELECT, CHECKBOX
};

export interface AnnouncementFilters {
  categorySlug?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string; // Recherche dans titre/description
  fieldFilters?: Record<string, any>; // Filtres dynamiques par champ
  userId?: number;
  status?: string;
}

export interface FormSchema {
  category: Category;
  fields: Array<{
    field: FieldWithOptions;
    required: boolean;
    order: number;
    dependsOn?: string;
    showWhen?: string;
  }>;
}

export interface FieldValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
}
