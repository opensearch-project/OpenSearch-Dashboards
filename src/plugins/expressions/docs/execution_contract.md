# ExecutionContract in the Expressions Plugin

The `ExecutionContract` is a powerful feature of the Expressions plugin that provides fine-grained control over expression execution. It allows you to interact with a running expression, monitor its progress, and handle its results or errors.

## Usage

Here's how you can create and use an `ExecutionContract`:

```typescript
import { ExpressionsStart } from '../../../src/plugins/expressions/public';

const useExpressionExecution = (expressionsStart: ExpressionsStart, expression: string) => {
  const executionContract = expressionsStart.execute(expression);

  // ... use the executionContract
};
```

## Key Methods and Properties

### `getData(): Promise<any>`

Retrieves the final output of the expression.

### `cancel(): void`

Cancels the ongoing expression execution.

### `getAst(): ExpressionAstExpression`

Returns the Abstract Syntax Tree (AST) of the expression.

### `getExpression(): string`

Returns the original expression string.

### `isPending: boolean`

A boolean indicating whether the expression execution is still in progress.

### `inspect(): Adapters`

Returns inspector adapters for debugging purposes.

## Advanced Usage: Progress Monitoring

```typescript
const monitorProgress = async (executionContract) => {
  while (executionContract.isPending) {
    console.log('Execution in progress...');
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms
  }

  try {
    const result = await executionContract.getData();
    console.log('Execution completed:', result);
  } catch (error) {
    console.error('Execution failed:', error);
  }
};

// Usage
const executionContract = expressionsStart.execute('myExpression arg1=value1');
monitorProgress(executionContract);
```

## Error Handling

```typescript
import { isExpressionValueError } from '../../../src/plugins/expressions/common';

const handleExecution = async (executionContract) => {
  try {
    const result = await executionContract.getData();
    if (isExpressionValueError(result)) {
      console.error('Expression error:', result.error);
    } else {
      console.log('Expression result:', result);
    }
  } catch (error) {
    console.error('Execution error:', error);
  }
};
```

## Best Practices

1. Always handle potential errors
2. Cancel unnecessary executions
3. Use inspector adapters for detailed debugging
4. Check `isPending` before attempting to get data or perform operations

The `ExecutionContract` provides a powerful interface for working with expressions in a flexible and controlled manner.
