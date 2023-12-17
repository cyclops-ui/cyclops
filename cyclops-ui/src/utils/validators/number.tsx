import type { Rule, RuleObject } from 'rc-field-form/lib/interface';

export function numberInputValidators(field: any, isRequired: boolean): Rule[] {
    let rules: Rule[] = [];

    rules.push({ required: isRequired });
    rules.push({ validator: validateMin(field) });
    rules.push({ validator: validateMax(field) });
    rules.push({ validator: validateMultiple(field) });

    return rules
}

function validateMin(field: any) {
    if (isFieldNullOrUndefined(field, "minimum")) {
        return (_: RuleObject, value: any) => Promise.resolve();
    }

    return (_: RuleObject, value: any): Promise<any> => {
        return value > field.minimum ? Promise.resolve() : Promise.reject(`Number must be greater than ${field.minimum}`);
    };
}

function validateMax(field: any) {
    if (isFieldNullOrUndefined(field, "maximum")) {
        return (_: RuleObject, value: any) => Promise.resolve();
    }

    return (_: RuleObject, value: any): Promise<any> => {
        return value < field.maximum ? Promise.resolve() : Promise.reject(`Number must be less than ${field.maximum}`);
    };
}

function validateMultiple(field: any) {
    if (isFieldNullOrUndefined(field, "multipleOf")) {
        return (_: RuleObject, value: any) => Promise.resolve();
    }

    return (_: RuleObject, value: any): Promise<any> => {
        const epsilon = 1e-10;

        return Math.abs(value - Math.round(value / field.multipleOf) * field.multipleOf) < epsilon ?
            Promise.resolve() :
            Promise.reject(`Number must be a multiple of ${field.multipleOf}`);
    };
}

const isFieldNullOrUndefined = (obj: Record<string, any>, fieldName: string): boolean => {
    return !obj || obj[fieldName] === null || obj[fieldName] === undefined;
};
