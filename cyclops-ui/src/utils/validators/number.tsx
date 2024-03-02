import type { Rule, RuleObject } from "rc-field-form/lib/interface";
import { isFieldNullOrUndefined } from "./common";

export function numberInputValidators(field: any, isRequired: boolean): Rule[] {
  let rules: Rule[] = [];

  if (isRequired) {
    rules.push({ required: isRequired });
  }

  let min = validateMin(field);
  if (min !== null) {
    rules.push({ validator: min });
  }

  let max = validateMax(field);
  if (max !== null) {
    rules.push({ validator: max });
  }

  let multiple = validateMultiple(field);
  if (multiple != null) {
    rules.push({ validator: multiple });
  }

  return rules;
}

function validateMin(field: any) {
  if (isFieldNullOrUndefined(field, "minimum")) {
    return null;
  }

  return (_: RuleObject, value: any): Promise<any> => {
    return value >= field.minimum
      ? Promise.resolve()
      : Promise.reject(`Number must be greater or equal to ${field.minimum}`);
  };
}

function validateMax(field: any) {
  if (isFieldNullOrUndefined(field, "maximum")) {
    return null;
  }

  return (_: RuleObject, value: any): Promise<any> => {
    return value <= field.maximum
      ? Promise.resolve()
      : Promise.reject(`Number must be less or equal to ${field.maximum}`);
  };
}

function validateMultiple(field: any) {
  if (isFieldNullOrUndefined(field, "multipleOf")) {
    return null;
  }

  return (_: RuleObject, value: any): Promise<any> => {
    const epsilon = 1e-10;

    return Math.abs(
      value - Math.round(value / field.multipleOf) * field.multipleOf
    ) < epsilon
      ? Promise.resolve()
      : Promise.reject(`Number must be a multiple of ${field.multipleOf}`);
  };
}
