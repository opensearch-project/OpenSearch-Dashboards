# URL Forwarding Plugin for OpenSearch Dashboards

## Table of Contents

1. [Introduction](#introduction)
2. [Purpose](#purpose)
3. [Setup](#setup)
4. [Usage](#usage)
   - [Forwarding Apps](#forwarding-apps)
   - [Navigating to Default App](#navigating-to-default-app)
   - [Navigating to Legacy OpenSearch Dashboards URLs](#navigating-to-legacy-opensearch-dashboards-urls)
5. [Internal Workings](#internal-workings)
   - [Plugin Structure](#plugin-structure)
   - [Forward Definitions](#forward-definitions)
   - [URL Normalization](#url-normalization)
   - [Navigation Handling](#navigation-handling)
6. [API Reference](#api-reference)
7. [Examples](#examples)
8. [Limitations and Considerations](#limitations-and-considerations)

## Introduction

The URL Forwarding plugin is a crucial component in OpenSearch Dashboards that helps manage and redirect legacy URLs to their new counterparts. This plugin is especially useful during migrations or when restructuring the application's URL scheme.

## Purpose

The main purposes of the URL Forwarding plugin are:

1. To provide a seamless transition for users accessing old URLs.
2. To maintain backward compatibility with bookmarked or externally referenced URLs.
3. To facilitate the migration of legacy OpenSearch Dashboards apps to new platform applications.

## Setup

The URL Forwarding plugin is set up as part of the OpenSearch Dashboards core. To use it in your OpenSearch Dashboards instance, ensure that it's properly included in your plugins configuration.

```typescript
import { UrlForwardingPlugin } from './public/plugin';

export const plugin = () => new UrlForwardingPlugin();
```

## Usage

### Forwarding Apps

To forward URLs from a legacy app to a new platform application, use the `forwardApp` method during the setup phase:

```typescript
urlForwarding.forwardApp(
  legacyAppId: string,
  newAppId: string,
  rewritePath?: (legacyPath: string) => string
);
```

- `legacyAppId`: The identifier of the old app to forward URLs from.
- `newAppId`: The identifier of the new app that will handle the URLs.
- `rewritePath`: (Optional) A function to rewrite the legacy sub-path to the new path in the core app.

Example:

```typescript
urlForwarding.forwardApp('old', 'new', (path) => {
  const [, id] = /old\/item\/(.*)$/.exec(path) || [];
  if (!id) {
    return '#/home';
  }
  return `#/items/${id}`;
});
```

This setup will cause the following redirects:

- `app/opensearch-dashboards#/old/` -> `app/new#/home`
- `app/opensearch-dashboards#/old/item/123` -> `app/new#/items/123`

### Navigating to Default App

To navigate to the default app defined in OpenSearch Dashboards configuration:

```typescript
urlForwardingStart.navigateToDefaultApp({ overwriteHash: boolean });
```

This method takes into account any registered forwards and uses the appropriate mechanism to navigate.

### Navigating to Legacy OpenSearch Dashboards URLs

To resolve and navigate to legacy OpenSearch Dashboards URLs:

```typescript
const result = urlForwardingStart.navigateToLegacyOpenSearchDashboardsUrl(hash: string);
```

This method returns an object with a `navigated` property indicating whether a navigation occurred.

## Internal Workings

### Plugin Structure

The URL Forwarding plugin consists of several key components:

1. `UrlForwardingPlugin`: The main plugin class that handles setup, start, and stop lifecycle methods.
2. `ForwardDefinition`: An interface defining the structure of forward rules.
3. `createLegacyUrlForwardApp` and `createLegacyUrlForwardCurrentApp`: Functions that create apps to handle legacy URL forwarding.
4. `navigateToLegacyOpenSearchDashboardsUrl`: A function that performs the actual navigation based on forward definitions.
5. `normalizePath`: A utility function to normalize URL paths.

### Forward Definitions

Forward definitions are stored internally as an array of `ForwardDefinition` objects:

```typescript
interface ForwardDefinition {
  legacyAppId: string;
  newAppId: string;
  rewritePath: (legacyPath: string) => string;
}
```

These definitions are used to determine how to rewrite and redirect legacy URLs.

### URL Normalization

The plugin uses a `normalizePath` function to ensure consistent handling of URLs:

1. It resolves `../` within the path.
2. It strips any leading slashes and dots, replacing them with a single leading slash.

### Navigation Handling

The plugin handles navigation in different ways depending on the context:

1. If the target app is different from the current app, it uses `application.navigateToApp`.
2. If the target app is the current app, it updates the window's hash directly.
3. For the legacy OpenSearch Dashboards app, it sets the `window.location.href`.

## API Reference

### Setup Phase

- `forwardApp(legacyAppId: string, newAppId: string, rewritePath?: (legacyPath: string) => string): void`

### Start Phase

- `navigateToDefaultApp({ overwriteHash: boolean }): void`
- `navigateToLegacyOpenSearchDashboardsUrl(hash: string): { navigated: boolean }`
- `getForwards(): ForwardDefinition[]` (deprecated)

## Examples

1. Forwarding a simple app:

```typescript
urlForwarding.forwardApp('oldDashboard', 'newDashboard');
```

2. Forwarding with custom path rewriting:

```typescript
urlForwarding.forwardApp('oldVisualizations', 'newVisualizations', (path) => {
  const match = /oldVisualizations\/view\/(.*)$/.exec(path);
  return match ? `#/view/${match[1]}` : '#/';
});
```

3. Navigating to the default app:

```typescript
urlForwardingStart.navigateToDefaultApp({ overwriteHash: true });
```

4. Handling a legacy URL:

```typescript
const result = urlForwardingStart.navigateToLegacyOpenSearchDashboardsUrl('/oldApp/some/path');
if (result.navigated) {
  console.log('Successfully navigated to new URL');
} else {
  console.log('No matching forward found');
}
```

## Limitations and Considerations

1. The plugin relies on the OpenSearch Dashboards core services and may not work independently.
2. It's designed primarily for handling internal OpenSearch Dashboards URLs and may not be suitable for external URL rewrites.
3. The `getForwards` method is deprecated and should not be used in new implementations.
4. Care should be taken when defining forward rules to avoid circular redirects or unintended behavior.
5. The plugin doesn't handle deep linking within apps; that responsibility lies with individual app implementations.

By using the URL Forwarding plugin, OpenSearch Dashboards developers can ensure a smooth transition when restructuring their application's URL scheme, maintaining backward compatibility, and providing a seamless user experience during migrations.
