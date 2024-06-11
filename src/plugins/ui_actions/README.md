# UI Actions

This plugin exposes a global event bus for the OpenSearch Dashboards UI that allows other plugins to expand the ui capabilities of the application using `actions` and `triggers`. Plugins can not only register actions and triggers that trigger an action, but also use existing triggers and actions for their own use case. Multiple actions can be associated with a single trigger. All the capabilities are exposed using the uiActions service.

Some of the uses in Dashboards for UI Actions are:

1. For the context menus in a dashboard panel
2. Interacting directly with a visualization to trigger filters and to select time ranges.

## API

You can use the UI Actions service API's for the following use cases:

- creating custom functionality (`actions`)
- creating custom user interaction events (`triggers`)
- attaching and detaching `actions` to `triggers`.
- emitting `trigger` events
- executing `actions` attached to a given `trigger`.
- exposing a context menu for the user to choose the appropriate action when there are multiple actions attached to a single trigger.

The API for the service can be found in [./public/service/ui_actions_service.ts](./public/service/ui_actions_service.ts)

## Usage

### Creating an action

```ts
const ACTION_ID = 'ACTION_ID';

// Declare the context mapping so that it is clear to the user what context the action should receive
declare module '../../../src/plugins/ui_actions/public' {
  export interface ActionContextMapping {
    [ACTION_ID]: ActionContext;
  }
}

// Create the action
const action = createAction<typeof ACTION_ID>({
  execute: async (context: ActionContext) => {}, // Action to execute when called
  id: ACTION_ID,
  // ...other action properties
});

// Register the action with the service
uiActions.registerAction(action);
```

### Creating a trigger

```ts
const TRIGGER_ID = 'TRIGGER_ID';

// Declare the context mapping so that it is clear to the user what context the trigger should be called with
declare module '../../../src/plugins/ui_actions/public' {
  export interface TriggerContextMapping {
    [TRIGGER_ID]: TriggerContext; // The context that the trigger will execute with
  }
}

// Create the trigger
const trigger: Trigger<'TRIGGER_ID'> = {
  id: TRIGGER_ID,
};

// Register the trigger
uiActions.registerTrigger(trigger);
```

### Attach an action to a trigger

There are two ways to do this:

1. Attach a registered action to a registered trigger

```ts
uiActions.attachAction(TRIGGER_ID, ACTION_ID);
```

2. Register a action to a registered trigger (If the action is not registered, this method also registers the action)

```ts
uiActions.addTriggerAction(TRIGGER_ID, action);
```

### Trigger an event

Triggering an action is very simple. Just get the trigger using its ID and execute it with the appropriate context.

```ts
uiActions.getTrigger(trigger.id).exec(context);
```

## Explorer

Use the UI actions explorer in the Developer examples to learn more about the service and its features. It can be started up using the `--run-examples` flag and found under the `Developer examples` option in the main menu.

```sh
yarn start --run-examples
```

## Action Properties

Refer to [./public/actions/action.ts](./public/actions/action.ts) for all properties, keeping in mind it extends the [presentable](./public/util/presentable.ts) interface. Here are some properties that provide special functionality and customization.

- `order` is used when there is more than one action matched to a trigger and within context menus. Higher numbers are displayed first.
- `getDisplayName` is a function that can return either a string or a JSX element. Returning a JSX element allows flexibility with formatting.
- `getIconType` can be used to add an icon before the display name.
- `grouping` determines where this item should appear as a submenu. Each group can also contain a category, which is used within context menus to organize similar groups into the same section of the menu. See examples explorer for more details about what this looks like within a context menu.
