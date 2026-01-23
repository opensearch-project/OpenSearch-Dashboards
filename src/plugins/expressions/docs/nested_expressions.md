# Nested Expressions

Nested expressions are a powerful feature of the Expressions plugin that allow you to compose complex data transformations and visualizations by embedding one expression within another.

## Syntax

Nested expressions are enclosed in curly braces `{}` within the parent expression.

Basic syntax:

```
parentFunction arg1={nestedFunction nestedArg1=value1 | anotherNestedFunction}
```

## Examples

### Basic Nesting

```
avg salary={opensearchDashboards | opensearchaggs index="employees" metric={avg field="salary"}}
```

### Multiple Nested Expressions

```
compareMetrics
  metric1={opensearchDashboards | opensearchaggs index="sales" metric={sum field="revenue"}}
  metric2={opensearchDashboards | opensearchaggs index="costs" metric={sum field="expenses"}}
```

### Deep Nesting

```
formatNumber
  value={math
    equation="x - y"
    params={
      x={opensearchDashboards | opensearchaggs index="sales" metric={sum field="revenue"}},
      y={opensearchDashboards | opensearchaggs index="costs" metric={sum field="expenses"}}
    }
  }
  format="$0,0.00"
```

## Creating Functions that Support Nested Expressions

```typescript
import { ExpressionFunctionDefinition } from '../../../src/plugins/expressions/public';

export const myFunction: ExpressionFunctionDefinition<
  'myFunction',
  any,
  { nestedArg: any },
  any
> = {
  name: 'myFunction',
  args: {
    nestedArg: {
      types: ['expression', 'string', 'number'],
      help: 'This argument supports a nested expression',
    },
  },
  fn: async (input, args, context) => {
    const nestedResult = await context.expressions.evaluate(args.nestedArg, input);
    // Process nestedResult...
  },
};
```
