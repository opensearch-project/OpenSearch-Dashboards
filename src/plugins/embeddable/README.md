# Embeddable Plugin

## Table of Contents

1. [Overview](#overview)
2. [Key Concepts](#key-concepts)
3. [API Reference](#api-reference)
   - [Setup](#setup)
   - [Start](#start)
4. [Creating an Embeddable](#creating-an-embeddable)
5. [Using Embeddables](#using-embeddables)
6. [Containers](#containers)
7. [Enhancements](#enhancements)
8. [State Transfer](#state-transfer)
9. [Embeddable Panel](#embeddable-panel)
10. [Reference or Value Embeddables](#reference-or-value-embeddables)
11. [Examples](#examples)
12. [Best Practices](#best-practices)

## Overview

The Embeddable plugin provides a framework for creating reusable UI widgets that can be rendered in various contexts within OpenSearch Dashboards. Embeddables are self-contained UI widgets that can be dynamically added to any page or dashboard in OpenSearch Dashboards. They are designed to be:

- Reusable across different parts of the application
- Configurable with their own input/output
- Rendererable within containers (like dashboards)

### Embeddable containers

Containers are a special type of embeddable that can contain nested embeddables. Embeddables can be dynamically added to embeddable _containers_. Currently only dashboard uses this interface.

## Examples

Many example embeddables are implemented and registered [here](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/main/examples/embeddable_examples). They can be played around with and explored [in the Embeddable Explorer example plugin](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/main/examples/embeddable_explorer). Just run OpenSearch Dashboards with

```
yarn start --run-examples
```

and navigate to the Embeddable explorer app.

There is also an example of rendering dashboard container outside of dashboard app [here](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/main/examples/dashboard_embeddable_examples).

## Docs

[Embeddable docs, guides & caveats](./docs/README.md)

## Testing

Run unit tests

```shell
node scripts/jest embeddable
```

## Key Concepts

- **Embeddable**: A reusable widget with its own input, output, and rendering logic.
- **Container**: A special type of embeddable that can contain other embeddables.
- **Factory**: Responsible for creating embeddable instances.

## API Reference

### Setup

The `EmbeddableSetup` interface provides methods for registering embeddable factories and enhancements during the setup phase:

```typescript
interface EmbeddableSetup {
  registerEmbeddableFactory: <
    I extends EmbeddableInput,
    O extends EmbeddableOutput,
    E extends IEmbeddable<I, O> = IEmbeddable<I, O>
  >(
    id: string,
    factory: EmbeddableFactoryDefinition<I, O, E>
  ) => () => EmbeddableFactory<I, O, E>;
  registerEnhancement: (enhancement: EnhancementRegistryDefinition) => void;
  setCustomEmbeddableFactoryProvider: (customProvider: EmbeddableFactoryProvider) => void;
}
```

### Start

The `EmbeddableStart` interface provides methods for working with embeddables during the start phase:

```typescript
interface EmbeddableStart extends PersistableStateService<EmbeddableStateWithType> {
  getEmbeddableFactory: <
    I extends EmbeddableInput = EmbeddableInput,
    O extends EmbeddableOutput = EmbeddableOutput,
    E extends IEmbeddable<I, O> = IEmbeddable<I, O>
  >(
    embeddableFactoryId: string
  ) => EmbeddableFactory<I, O, E> | undefined;
  getEmbeddableFactories: () => IterableIterator<EmbeddableFactory>;
  EmbeddablePanel: EmbeddablePanelHOC;
  getEmbeddablePanel: (stateTransfer?: EmbeddableStateTransfer) => EmbeddablePanelHOC;
  getStateTransfer: (history?: ScopedHistory) => EmbeddableStateTransfer;
}
```

## Creating an Embeddable

1. Define your embeddable input and output:

```typescript
interface MyEmbeddableInput extends EmbeddableInput {
  myCustomField: string;
}

interface MyEmbeddableOutput extends EmbeddableOutput {
  myCustomResult: number;
}
```

2. Create your embeddable class:

```typescript
class MyEmbeddable extends Embeddable<MyEmbeddableInput, MyEmbeddableOutput> {
  public readonly type = MY_EMBEDDABLE_TYPE;

  constructor(initialInput: MyEmbeddableInput, parent?: IContainer) {
    super(initialInput, { myCustomResult: 0 }, parent);
  }

  public render(dom: HTMLElement) {
    // Render your embeddable here
  }

  public reload() {
    // Implement reload logic
  }
}
```

3. Create a factory for your embeddable:

```typescript
class MyEmbeddableFactory
  implements EmbeddableFactoryDefinition<MyEmbeddableInput, MyEmbeddableOutput, MyEmbeddable> {
  public readonly type = MY_EMBEDDABLE_TYPE;

  public async create(initialInput: MyEmbeddableInput, parent?: IContainer) {
    return new MyEmbeddable(initialInput, parent);
  }

  // Implement other required methods...
}
```

4. Register your factory in the setup phase of your plugin:

```typescript
class MyPlugin implements Plugin<void, void> {
  public setup(core: CoreSetup, plugins: { embeddable: EmbeddableSetup }) {
    plugins.embeddable.registerEmbeddableFactory(MY_EMBEDDABLE_TYPE, new MyEmbeddableFactory());
  }
}
```

## Using Embeddables

To use an embeddable in your application:

```typescript
const factory = embeddableStart.getEmbeddableFactory<
  MyEmbeddableInput,
  MyEmbeddableOutput,
  MyEmbeddable
>(MY_EMBEDDABLE_TYPE);
if (factory) {
  const embeddable = await factory.create({ id: 'my-embeddable', myCustomField: 'value' });
  const domElement = document.getElementById('my-container');
  if (domElement) {
    embeddable.render(domElement);
  }
}
```

## Containers

Containers are special embeddables that can hold other embeddables:

```typescript
class MyContainer extends Container<MyContainerInput> {
  public readonly type = MY_CONTAINER_TYPE;

  constructor(
    initialInput: MyContainerInput,
    getFactory: EmbeddableStart['getEmbeddableFactory'],
    parent?: Container
  ) {
    super(initialInput, { embeddableLoaded: {} }, getFactory, parent);
  }

  public render(dom: HTMLElement) {
    // Render container and child embeddables
  }
}
```

## Enhancements

Enhancements provide a way to extend the functionality of embeddables without modifying their core implementation. They allow you to add new features or modify existing behavior in a modular and reusable way.

### Creating an Enhancement

1. Define your enhancement:

```typescript
import { EnhancementRegistryDefinition } from 'src/plugins/embeddable/public';

const myEnhancement: EnhancementRegistryDefinition = {
  id: 'myCustomEnhancement',
  extract: (state: SerializableState) => {
    // Extract enhancement-specific state
    return { state, references: [] };
  },
  inject: (state: SerializableState, references: SavedObjectReference[]) => {
    // Inject enhancement-specific state
    return state;
  },
  telemetry: (state: SerializableState, telemetryData: Record<string, any>) => {
    // Add enhancement-specific telemetry data
    return telemetryData;
  },
};
```

2. Register the enhancement in your plugin's setup phase:

```typescript
class MyPlugin implements Plugin<void, void> {
  public setup(core: CoreSetup, plugins: { embeddable: EmbeddableSetup }) {
    plugins.embeddable.registerEnhancement(myEnhancement);
  }
}
```

### Using Enhancements

Enhancements are automatically applied to embeddables when they are created or loaded. You can access enhancement data through the embeddable's input:

```typescript
const embeddable = await factory.create({
  id: 'my-embeddable',
  enhancements: {
    myCustomEnhancement: {
      // Enhancement-specific data
    },
  },
});
```

## State Transfer

The State Transfer feature allows embeddables to persist and restore their state across navigation events or when moving between different parts of the application.

### Using State Transfer

1. Get the state transfer object:

```typescript
const stateTransfer = embeddableStart.getStateTransfer(history);
```

2. Navigate to a new route with embeddable state:

```typescript
await stateTransfer.navigateToEditor('myApp', {
  path: '/edit',
  state: {
    originatingApp: 'currentApp',
    embeddableId: 'myEmbeddableId',
    valueInput: embeddable.getInput(),
  },
});
```

3. Retrieve state after navigation:

```typescript
const incomingState = stateTransfer.getIncomingEditorState();
if (incomingState) {
  // Use the state to restore the embeddable
}
```

## Embeddable Panel

The Embeddable Panel is a reusable component that provides a consistent container for embeddables, including common features like a title bar and context menu.

### Using Embeddable Panel

```typescript
const EmbeddablePanel = embeddableStart.getEmbeddablePanel();

// In your React component
<EmbeddablePanel embeddable={myEmbeddable} hideHeader={false} title="My Embeddable" />;
```

## Reference or Value Embeddables

Reference or Value Embeddables allow for flexible storage and retrieval of embeddable state, either by reference (saved object) or by value (inline state).

### Creating a Reference or Value Embeddable

```typescript
class MyRefOrValueEmbeddable
  extends Embeddable<MyInput, MyOutput>
  implements ReferenceOrValueEmbeddable {
  public readonly type = 'MY_REF_OR_VALUE_EMBEDDABLE';

  inputIsRefType = (
    input: MyInput | SavedObjectEmbeddableInput
  ): input is SavedObjectEmbeddableInput => {
    return 'savedObjectId' in input;
  };

  getInputAsValueType = async (): Promise<MyInput> => {
    // Convert current input to value type
  };

  getInputAsRefType = async (): Promise<SavedObjectEmbeddableInput> => {
    // Convert current input to reference type
  };

  // ... other methods
}
```

### Using Reference or Value Embeddables

```typescript
if (isReferenceOrValueEmbeddable(embeddable)) {
  const valueInput = await embeddable.getInputAsValueType();
  const refInput = await embeddable.getInputAsRefType();

  // Use valueInput for inline storage or refInput for saved object storage
}
```

## Examples

### Basic Embeddable

```typescript
class HelloWorldEmbeddable extends Embeddable<{ id: string; name: string }, { greeting: string }> {
  public readonly type = 'HELLO_WORLD';

  constructor(initialInput: { id: string; name: string }) {
    super(initialInput, { greeting: `Hello, ${initialInput.name}!` });
  }

  public render(dom: HTMLElement) {
    dom.innerHTML = `<h1>${this.getOutput().greeting}</h1>`;
  }

  public reload() {
    this.updateOutput({ greeting: `Hello, ${this.getInput().name}!` });
  }
}
```

### Using the Embeddable in a React Component

```tsx
import React, { useEffect, useRef } from 'react';
import { useEmbeddable } from './useEmbeddable'; // Custom hook to manage embeddable lifecycle

export const HelloWorldComponent: React.FC<{ name: string }> = ({ name }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const embeddable = useEmbeddable('HELLO_WORLD', { id: 'hello-1', name });

  useEffect(() => {
    if (containerRef.current && embeddable) {
      embeddable.render(containerRef.current);
    }
  }, [embeddable]);

  return <div ref={containerRef} />;
};
```

## Best Practices

1. Keep embeddables small and focused on a single responsibility.
2. Use the input/output pattern to make embeddables more reusable and composable.
3. Implement proper cleanup in the `destroy` method to prevent memory leaks.
4. Use containers to create complex layouts of embeddables.
5. Leverage the `EmbeddablePanel` component for consistent styling and behavior.
6. Use the `getStateTransfer` method for handling embeddable state across navigation.
7. Implement the `reload` method to refresh embeddable data when needed.
8. Use `registerEnhancement` to add additional functionality to embeddables without modifying their core implementation.
9. Consider using Reference or Value Embeddables for flexible state storage and retrieval.
10. Utilize State Transfer when navigating between different parts of your application to preserve embeddable state.
11. Implement proper error handling and loading states in your embeddables.
12. Use TypeScript to ensure type safety when working with embeddables and their inputs/outputs.
