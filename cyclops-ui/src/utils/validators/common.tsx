export const isFieldNullOrUndefined = (obj: Record<string, any>, fieldName: string): boolean => {
    return !obj || obj[fieldName] === null || obj[fieldName] === undefined;
};
