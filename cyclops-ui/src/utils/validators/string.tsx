import { isFieldNullOrUndefined } from "./common";

interface Validator {
  required?: Boolean;
  min?: Number;
  max?: Number;
  pattern?: RegExp;
  message?: String;
}

export function stringInputValidators(
  field: any,
  isRequired: boolean
): Validator[] {
  let rules: Validator[] = [];

  if (isRequired) {
    rules.push({ required: isRequired });
  }

  if (!isFieldNullOrUndefined(field, "minLength")) {
    rules.push({
      min: field.minLength,
      message: `Input must be longer than ${field.minLength} characters`,
    });
  }

  if (!isFieldNullOrUndefined(field, "maxLength")) {
    rules.push({
      max: field.maxLength,
      message: `Input must be shorter than ${field.maxLength} characters`,
    });
  }

  if (field["pattern"] !== "") {
    rules.push({
      pattern: new RegExp(field["pattern"]),
      message: "Input doesn't match requested pattern",
    });
  }

  return rules;
}
