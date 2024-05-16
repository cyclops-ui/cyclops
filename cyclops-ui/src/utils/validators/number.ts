import type { Rule } from "rc-field-form/lib/interface";
import { Validator, isFieldNullOrUndefined } from "./common";

export function numberInputValidators(
  field: any,
  isRequired: boolean,
): Validator[] {
  let rules: Validator[] = [];

  if (isRequired) {
    rules.push({ required: isRequired });
  }

  if (!isFieldNullOrUndefined(field, "minimum")) {
    let minimumValue = field.minimum;
    if (!isFieldNullOrUndefined(field, "exclusiveMinimum")) minimumValue++;
    rules.push({ type: "number", min: minimumValue });
  }

  if (!isFieldNullOrUndefined(field, "maximum")) {
    let maximumValue = field.maximum;
    if (!isFieldNullOrUndefined(field, "exclusiveMaximum")) maximumValue--;
    rules.push({ type: "number", max: maximumValue });
  }

  if (!isFieldNullOrUndefined(field, "multipleOf")) {
    rules.push({ validator: validateMultiple(field) });
  }

  return rules;
}

function validateMultiple(field: any) {
  return (_rule: Rule, value: any): Promise<any> => {
    const epsilon = 1e-10;

    return Math.abs(
      value - Math.round(value / field.multipleOf) * field.multipleOf,
    ) < epsilon
      ? Promise.resolve()
      : Promise.reject(
          `'${field.name}' must be a multiple of ${field.multipleOf}`,
        );
  };
}
