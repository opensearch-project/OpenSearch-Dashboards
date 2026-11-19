# Expression Renderers

Expression renderers are special functions that convert the output of an expression chain into a visual representation, typically a React component.

## Creating a Custom Renderer

Here's an example of creating a custom renderer:

```typescript
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { EuiAvatar } from '@elastic/eui';
import { ExpressionRenderDefinition } from '../../../../../src/plugins/expressions/public';

export interface AvatarRenderValue {
  name: string;
  size: string;
}

export const avatar: ExpressionRenderDefinition<AvatarRenderValue> = {
  name: 'avatar',
  displayName: 'Render an avatar',
  help: 'Renders an avatar with a given name and size',
  validate: () => undefined,
  reuseDomNode: true,
  render: (domNode, { name, size }, handlers) => {
    handlers.onDestroy(() => {
      unmountComponentAtNode(domNode);
    });

    render(<EuiAvatar size={size} name={name} />, domNode, handlers.done);
  },
};
```

## Registering a Custom Renderer

To register a custom renderer, use the `registerRenderer` method in your plugin's setup:

```typescript
expressions.registerRenderer(avatar);
```

## Renderer Structure

An expression renderer typically has the following properties:

- `name`: The name of the renderer, used to identify it
- `displayName`: A human-readable name for the renderer
- `help`: A description of what the renderer does
- `validate`: A function to validate the input data
- `reuseDomNode`: Whether the renderer can reuse the existing DOM node
- `render`: The actual implementation of the renderer

## Render Function

The `render` function is where the visual output is created. It receives:

- `domNode`: The DOM node to render into
- `data`: The data to be rendered
- `handlers`: An object containing utility functions and callbacks

## Handling Lifecycle Events

Renderers can handle lifecycle events using the provided handlers:

- `handlers.onDestroy`: Register a cleanup function
- `handlers.done`: Call when rendering is complete

## Sending Data from Renderers to the Application

Renderers can send data or events back to the main application using the `event` handler:

```typescript
render: (domNode, config, handlers) => {
  const handleClick = (data: any) => {
    handlers.event({
      name: 'myCustomEvent',
      data: data
    });
  };

  render(
    <MyInteractiveComponent
      data={config}
      onClick={handleClick}
    />,
    domNode,
    handlers.done
  );
},
```

In your application, use the `onEvent` prop of the `ReactExpressionRenderer` to handle these events:

```tsx
<ReactExpressionRenderer
  expression="myInteractiveRenderer"
  onEvent={(event) => {
    if (event.name === 'myCustomEvent') {
      console.log('Received data from renderer:', event.data);
    }
  }}
/>
```

This allows for two-way communication between your renderer and the main application, enabling rich, interactive visualizations.
