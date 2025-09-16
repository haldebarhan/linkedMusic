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
  label: string;
  value: string;
  order?: number;
}

export interface Field {
  id: number;
  key: string;
  label: string;
  inputType: FieldInputType;
  placeholder?: string;
  unit?: string;
  required?: boolean;
  options?: FieldOption[];
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
