import type { Rule } from "rc-field-form/lib/interface";

export interface Validator {
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (rule: Rule, value: any) => Promise<any>;
  message?: string;
}

export const isFieldNullOrUndefined = (
  obj: Record<string, any>,
  fieldName: string,
): boolean => {
  return !obj || obj[fieldName] === null || obj[fieldName] === undefined;
};

export function collapseColor(open: boolean): string {
  if (open) {
    return "#faca93";
  } else {
    return "#fae8d4";
  }
}
