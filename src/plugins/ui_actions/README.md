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

## Explorer

Use the UI actions explorer in the Developer examples to learn more about the service and its features. It can be started up using the `--run-examples` flag and found under the `Developer examples` option in the main menu.

```sh
yarn start --run-examples
```
