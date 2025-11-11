export type FieldInputType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'SELECT'
  | 'MULTISELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'TOGGLE'
  | 'RANGE';

export interface FieldOption {
  id: number;
  fieldId: number;
  label: string;
  value: string;
  order: number;
  active: boolean;
  metadata: any;
}

export interface Field {
  id: number;
  key: string;
  label: string;
  inputType: string;
  placeholder?: string;
  helpText?: string;
  unit?: string;
  required: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  pattern?: string | null;
  options: FieldOption[];
}

export interface CategoryField {
  categoryId: number;
  fieldId: number;
  required: boolean;
  visibleInFilter: boolean;
  visibleInForm: boolean;
  visibleInList: boolean;
  visibleInSearch: boolean;
  order: number;
  defaultValue: any;
  field: Field;
}

export interface CategorySchema {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  categoryFields: CategoryField[];
}

export interface ServiceType {
  id: number;
  slug: string;
  name: string;
}

export interface Category {
  id: number;
  categorySlug: string;
  category: string;
  services: ServiceType[];
  fields: Field[];
}

// DTO pour le backend
export interface FieldValueDto {
  fieldId: number;
  valueText?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueDate?: Date;
  valueJson?: any;
  optionIds?: number[];
}
