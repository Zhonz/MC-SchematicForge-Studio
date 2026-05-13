export type ComparisonOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
export type LogicalOperator = 'and' | 'or' | 'not';

export interface FilterCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

export interface FilterGroup {
  logical: LogicalOperator;
  conditions: Array<FilterCondition | FilterGroup>;
}

export class QueryFilter {
  private conditions: Array<FilterCondition | FilterGroup> = [];
  private logical: LogicalOperator = 'and';

  where(field: string, operator: ComparisonOperator, value: unknown): this {
    this.conditions.push({ field, operator, value });
    return this;
  }

  and(field: string, operator: ComparisonOperator, value: unknown): this {
    this.conditions.push({ field, operator, value });
    this.logical = 'and';
    return this;
  }

  or(field: string, operator: ComparisonOperator, value: unknown): this {
    this.conditions.push({ field, operator, value });
    this.logical = 'or';
    return this;
  }

  not(): this {
    if (this.conditions.length > 0) {
      this.conditions = [{ logical: 'not', conditions: this.conditions }];
    }
    return this;
  }

  evaluate(data: Record<string, unknown>): boolean {
    if (this.conditions.length === 0) return true;
    return this.evaluateConditions(this.conditions, this.logical, data);
  }

  private evaluateConditions(
    conditions: Array<FilterCondition | FilterGroup>,
    logical: LogicalOperator,
    data: Record<string, unknown>
  ): boolean {
    if (logical === 'and') {
      return conditions.every((c) => this.evaluateCondition(c, data));
    }
    if (logical === 'or') {
      return conditions.some((c) => this.evaluateCondition(c, data));
    }
    return false;
  }

  private evaluateCondition(condition: FilterCondition | FilterGroup, data: Record<string, unknown>): boolean {
    if ('logical' in condition) {
      return this.evaluateConditions(condition.conditions, condition.logical, data);
    }
    const { field, operator, value } = condition;
    const fieldValue = data[field];
    switch (operator) {
      case 'eq': return fieldValue === value;
      case 'neq': return fieldValue !== value;
      case 'gt': return (fieldValue as number) > (value as number);
      case 'gte': return (fieldValue as number) >= (value as number);
      case 'lt': return (fieldValue as number) < (value as number);
      case 'lte': return (fieldValue as number) <= (value as number);
      default: return false;
    }
  }

  toSQL(): string {
    if (this.conditions.length === 0) return '1=1';
    return this.conditionsToSQL(this.conditions, this.logical);
  }

  private conditionsToSQL(conditions: Array<FilterCondition | FilterGroup>, logical: LogicalOperator): string {
    const sqls = conditions.map((c) => {
      if ('logical' in c) {
        return `(${this.conditionsToSQL(c.conditions, c.logical)})`;
      }
      return this.conditionToSQL(c);
    });
    return sqls.join(` ${logical.toUpperCase()} `);
  }

  private conditionToSQL(condition: FilterCondition): string {
    const { field, operator, value } = condition;
    let op: string;
    switch (operator) {
      case 'eq': op = '='; break;
      case 'neq': op = '!='; break;
      case 'gt': op = '>'; break;
      case 'gte': op = '>='; break;
      case 'lt': op = '<'; break;
      case 'lte': op = '<='; break;
      default: op = '=';
    }
    const formattedValue = typeof value === 'string' ? `'${value}'` : value;
    return `${field} ${op} ${formattedValue}`;
  }
}

export function filter<T extends Record<string, unknown>>(
  data: T[],
  filter: QueryFilter
): T[] {
  return data.filter((item) => filter.evaluate(item));
}
