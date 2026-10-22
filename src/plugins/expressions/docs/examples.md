# Examples of using the Expressions Plugin

This document provides various examples of how to use the Expressions plugin in different scenarios.

## Basic Expression Execution

```typescript
import { ExpressionsStart } from '../../../src/plugins/expressions/public';

const executeExpression = async (expressions: ExpressionsStart) => {
  const result = await expressions.run('multiply input=5 | add val=10');
  console.log(result); // Output: 15
};
```

## Custom Function Registration and Usage

```typescript
import {
  ExpressionsSetup,
  ExpressionFunctionDefinition,
} from '../../../src/plugins/expressions/public';

const myFunction: ExpressionFunctionDefinition = {
  name: 'myFunction',
  help: 'A custom function',
  args: {
    factor: {
      types: ['number'],
      help: 'Factor to multiply by',
    },
  },
  fn: (input, args) => input * args.factor,
};

// In your plugin's setup
expressions.registerFunction(myFunction);

// Usage
const result = await expressions.run('myFunction factor=3 | add val=7', 5);
console.log(result); // Output: 22
```

## Creating and Using a Custom Renderer

```typescript
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { EuiButton } from '@elastic/eui';
import { ExpressionRenderDefinition } from '../../../src/plugins/expressions/public';

interface TimeClickerConfig {
  buttonText: string;
}

const TimeClicker: React.FC<{
  config: TimeClickerConfig;
  onTimeClick: () => void;
}> = ({ config, onTimeClick }) => <EuiButton onClick={onTimeClick}>{config.buttonText}</EuiButton>;

export const timeClickerRenderer: ExpressionRenderDefinition<TimeClickerConfig> = {
  name: 'timeClicker',
  displayName: 'Time Clicker',
  help: 'Renders a button that sends the current time when clicked',
  validate: () => undefined,
  reuseDomNode: true,
  render: (domNode, config, handlers) => {
    const onTimeClick = () => {
      handlers.event({
        name: 'timeClick',
        data: {
          time: new Date().toISOString(),
        },
      });
    };

    handlers.onDestroy(() => {
      unmountComponentAtNode(domNode);
    });

    render(<TimeClicker config={config} onTimeClick={onTimeClick} />, domNode, handlers.done);
  },
};

// In your application
const MyApp: React.FC = () => {
  const [lastClickTime, setLastClickTime] = useState<string | null>(null);

  const handleEvent = (event: any) => {
    if (event.name === 'timeClick') {
      setLastClickTime(event.data.time);
    }
  };

  return (
    <div>
      <ReactExpressionRenderer
        expression='timeClicker buttonText="Click me!"'
        onEvent={handleEvent}
      />
      {lastClickTime && <p>Last click time: {lastClickTime}</p>}
    </div>
  );
};
```

## Expressions Example Plugin

For more comprehensive examples and interactive demonstrations of the Expressions plugin, you can refer to the Expressions Example plugin included in the OpenSearch Dashboards repository. This plugin provides a sandbox environment where you can explore various aspects of the Expressions plugin.

To access the Expressions Example plugin:

1. Start OpenSearch Dashboards with the `--run-examples` flag:

   ```
   yarn start --run-examples
   ```

2. Navigate to the "Developer Examples" section in the main menu.

3. Select the "Expressions" example from the list.

The Expressions Example plugin includes several tabs that demonstrate different features:

- **Basic**: Shows how to execute simple expressions and display results.
- **Rendering**: Demonstrates creating and using custom renderers.
- **Handlers**: Illustrates how to use expression handlers for interactivity.
- **Playground**: Provides an interactive environment to write and execute custom expressions.
- **Explorer**: Offers a way to browse all registered functions and their properties.

These examples in the plugin provide a hands-on way to learn about the Expressions plugin's capabilities and can serve as a reference when implementing expressions in your own plugins or applications.

For the source code of these examples, you can refer to the `examples/expressions_example` directory in the OpenSearch Dashboards repository. This can be particularly useful if you want to see how certain features are implemented or if you're looking for more complex usage patterns.
