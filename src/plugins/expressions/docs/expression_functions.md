# Expression Functions

Expression functions are the building blocks of the Expressions plugin. They allow you to transform data, perform calculations, and create visualizations.

## Creating a Custom Function

Here's an example of creating a custom function:

```typescript
import { ExpressionFunctionDefinition } from '../../../../../src/plugins/expressions/public';

export const square: ExpressionFunctionDefinition<'square', number, {}, any> = {
  name: 'square',
  help: 'Squares the input',
  args: {},
  fn: async (input) => {
    return input * input;
  },
};
```

## Registering a Custom Function

To register a custom function, use the `registerFunction` method in your plugin's setup:

```typescript
expressions.registerFunction(square);
```

## Function Structure

An expression function typically has the following properties:

- `name`: The name of the function, used in expressions
- `help`: A description of what the function does
- `args`: An object describing the function's arguments
- `fn`: The actual implementation of the function

## Function Arguments

Arguments allow functions to be customized. They are defined in the `args` property:

```typescript
args: {
  myArg: {
    types: ['string'],
    help: 'Description of the argument',
    default: 'Default value',
  },
},
```

## Asynchronous Functions

Functions can be asynchronous, allowing for operations like data fetching:

```typescript
fn: async (input, args, context) => {
  const result = await fetchData(args.query);
  return processResult(result);
},
```

## Accessing Context

Functions can access the shared context object:

```typescript
fn: (input, args, context) => {
  const timeRange = context.timeRange;
  // Use timeRange in your function logic
},
```

## Supporting Nested Expressions

Functions can be designed to accept nested expressions as arguments:

```typescript
args: {
  nestedArg: {
    types: ['expression', 'string', 'number'],
    help: 'This argument supports a nested expression',
  },
},
fn: async (input, args, context) => {
  let nestedValue;
  if (typeof args.nestedArg === 'object' && args.nestedArg.type === 'expression') {
    nestedValue = await context.expressions.evaluate(args.nestedArg, input);
  } else {
    nestedValue = args.nestedArg;
  }
  // Use nestedValue in your function logic
},
```

For more advanced usage and examples, check the Examples documentation.
