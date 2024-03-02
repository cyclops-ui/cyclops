import type { Rule, RuleObject } from "rc-field-form/lib/interface";
import { isFieldNullOrUndefined } from "./common";

export function stringInputValidators(field: any, isRequired: boolean): Rule[] {
  let rules: Rule[] = [];

  if (isRequired) {
    rules.push({ required: isRequired });
  }

  let minLength = validateMinLength(field);
  if (minLength !== null) {
    rules.push({ validator: minLength });
  }

  let maxLength = validateMaxLength(field);
  if (maxLength !== null) {
    rules.push({ validator: maxLength });
  }

  return rules;
}

function validateMinLength(field: any) {
  if (isFieldNullOrUndefined(field, "minLength")) {
    return null;
  }

  return (_: RuleObject, value: any): Promise<any> => {
    return value.toString().length >= field.minLength
      ? Promise.resolve()
      : Promise.reject(
          `Input must be longer than ${field.minLength} characters`
        );
  };
}

function validateMaxLength(field: any) {
  if (isFieldNullOrUndefined(field, "maxLength")) {
    return null;
  }

  return (_: RuleObject, value: any): Promise<any> => {
    return value.toString().length <= field.maxLength
      ? Promise.resolve()
      : Promise.reject(
          `Input must be shorter than ${field.maxLength} characters`
        );
  };
}
