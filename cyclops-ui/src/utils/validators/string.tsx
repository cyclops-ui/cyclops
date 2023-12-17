import type { Rule, RuleObject } from 'rc-field-form/lib/interface';
import {isFieldNullOrUndefined} from "./common";

export function stringInputValidators(field: any, isRequired: boolean): Rule[] {
    let rules: Rule[] = [];

    rules.push({ required: isRequired });
    rules.push({ validator: validateMinLength(field) });
    rules.push({ validator: validateMaxLength(field) });

    return rules
}

function validateMinLength(field: any) {
    if (isFieldNullOrUndefined(field, "minLength")) {
        return (_: RuleObject, value: any) => Promise.resolve();
    }

    return (_: RuleObject, value: any): Promise<any> => {
        return value.toString().length >= field.minLength ? Promise.resolve() : Promise.reject(`Input must be longer than ${field.minLength} characters`);
    };
}

function validateMaxLength(field: any) {
    if (isFieldNullOrUndefined(field, "maxLength")) {
        return (_: RuleObject, value: any) => Promise.resolve();
    }

    return (_: RuleObject, value: any): Promise<any> => {
        return value.toString().length <= field.maxLength ? Promise.resolve() : Promise.reject(`Input must be shorter than ${field.maxLength} characters`);
    };
}
