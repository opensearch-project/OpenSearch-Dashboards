# Inspector Adapters in the Expressions Plugin

Inspector adapters provide a way to collect and display additional debugging information about your expressions. They are especially useful for complex expressions or when you need to understand the internal workings of your functions.

## Types of Inspector Adapters

OpenSearch Dashboards provides several built-in inspector adapters:

1. **Data Adapter**: For displaying tabular data.
2. **Requests Adapter**: For showing network requests made during expression execution.
3. **Variables Adapter**: For displaying variables used in the expression.

## Adding Inspector Adapters to Your Expression

### 1. Create Inspector Adapters

```typescript
import { Adapters, DataAdapter, RequestAdapter } from '../../../src/plugins/inspector/public';

const inspectorAdapters: Adapters = {
  data: new DataAdapter(),
  requests: new RequestAdapter(),
};
```

### 2. Use Adapters in Your Expression Function

```typescript
import { ExpressionFunctionDefinition } from '../../../src/plugins/expressions/public';

export const myFunction: ExpressionFunctionDefinition<'myFunction', any, {}, any> = {
  name: 'myFunction',
  help: 'A function with inspector adapters',
  args: {},
  fn: async (input, args, context) => {
    const { data, requests } = context.inspectorAdapters as Adapters;

    // Log a request
    const request = requests.start('My Request', 'my_request');
    request.stats({ total: 100, loaded: 50 });

    // Log some data
    data.setRows([
      { col1: 'value1', col2: 'value2' },
      { col1: 'value3', col2: 'value4' },
    ]);

    // Your function logic here...

    requests.finish(request);
    return result;
  },
};
```

### 3. Pass Adapters to the Expression Execution

```typescript
const executionContract = expressions.execute('myFunction', {
  inspectorAdapters,
});
```

### 4. Access Adapters from ExecutionContract

```typescript
const adapters = executionContract.inspect();
console.log(adapters.data.getRows());
console.log(adapters.requests.getRequests());
```

## Creating Custom Adapters

You can create custom adapters for specific debugging needs:

```typescript
import { CustomAdapter } from '../../../src/plugins/inspector/public';

class MyCustomAdapter extends CustomAdapter {
  private logs: string[] = [];

  log(message: string) {
    this.logs.push(message);
  }

  getLogs() {
    return this.logs;
  }
}

// Usage
const inspectorAdapters = {
  data: new DataAdapter(),
  requests: new RequestAdapter(),
  custom: new MyCustomAdapter(),
};
```

## Best Practices

1. Use appropriate adapters for the type of data you're logging.
2. Don't overuse adapters as it can impact performance.
3. Clear adapters if reusing adapter instances.
4. Create custom adapters for domain-specific debugging needs.
5. Be cautious about sensitive data logged to adapters, especially in production environments.

## Viewing Inspector Data

1. Open the OpenSearch Dashboards Inspector panel (usually an "i" icon or "Inspect" option).
2. Select the appropriate tab corresponding to the adapter (e.g., "Data", "Requests").
3. Explore the logged information.

By effectively using inspector adapters, you can gain valuable insights into the execution of your expressions, making debugging and optimization much easier.
