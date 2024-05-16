import { Validator, isFieldNullOrUndefined } from "./common";

export function stringInputValidators(
  field: any,
  isRequired: boolean,
): Validator[] {
  let rules: Validator[] = [];

  if (isRequired) {
    rules.push({ required: isRequired });
  }

  if (!isFieldNullOrUndefined(field, "minLength")) {
    rules.push({ min: field.minLength });
  }

  if (!isFieldNullOrUndefined(field, "maxLength")) {
    rules.push({ max: field.maxLength });
  }

  if (!isFieldNullOrUndefined(field, "pattern")) {
    rules.push({
      pattern: new RegExp(field["pattern"]),
      message: "Input doesn't match requested pattern",
    });
  }

  return rules;
}
