export function resolveConditions(conditions: any[], values: any): boolean {
  for (let condition of conditions) {
    if (!resolveCondition(condition, values)) {
      return false;
    }
  }

  return true;
}

export function resolveCondition(condition: any, values: any): boolean {
  const value = values[condition.property];

  if (condition.operation === "eq") {
    console.log(
      "should update",
      value,
      condition.const,
      value === condition.const,
    );
    return value === condition.const;
  }

  if (condition.operation === "neq") {
    return value !== condition.const;
  }

  return true;
}
