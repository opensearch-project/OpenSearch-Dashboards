# Newsfeed Plugin

## Table of Contents

1. [Introduction](#introduction)
2. [Configuration](#configuration)
3. [Features](#features)
4. [Components](#components)
5. [API and Data Flow](#api-and-data-flow)
6. [Internationalization](#internationalization)
7. [Storage and Caching](#storage-and-caching)
8. [Usage](#usage)
9. [Development](#development)

## Introduction

The Newsfeed plugin for OpenSearch Dashboards provides a way to display news and updates to users within the OpenSearch Dashboards interface. It fetches news items from a remote service and presents them in a flyout accessible from the application's header.

Key features:

- Fetches news items from a configurable remote service
- Supports multiple languages
- Caches news items and tracks which items are new
- Provides a customizable UI component for displaying news
- Supports multiple newsfeed endpoints
- Implements error handling and retry mechanisms
- Fetches version-specific news

## Configuration

The plugin's configuration is defined in `config.ts` and includes the following options:

```typescript
{
  enabled: boolean;
  service: {
    pathTemplate: string;
    urlRoot: string;
  }
  defaultLanguage: string;
  mainInterval: Duration;
  fetchInterval: Duration;
}
```

- `enabled`: Enables or disables the plugin (default: `true`)
- `service.pathTemplate`: The path template for the news service API (default: `/opensearch-dashboards/v{VERSION}.json`)
- `service.urlRoot`: The root URL for the news service (different for production and development environments)
- `defaultLanguage`: The default language for news items (default: `'en'`)
- `mainInterval`: How often to retry failed fetches and check for updates (default: `'2m'`)
- `fetchInterval`: How often to fetch from the remote service (default: `'1d'`)

## Features

### Multiple Newsfeed Endpoints

The plugin supports different newsfeed endpoints, allowing for specialized news feeds:

- `OPENSEARCH_DASHBOARDS`: General OpenSearch Dashboards news
- `OPENSEARCH_DASHBOARDS_ANALYTICS`: Analytics-specific news
- `SECURITY_SOLUTION`: Security-related news
- `OBSERVABILITY`: Observability-related news

### Version-specific News

The plugin fetches news items specific to the current version of OpenSearch Dashboards. This ensures that users receive relevant updates and information for their installed version.

### Error Handling and Retries

The plugin implements robust error handling and retry mechanisms:

- Failed fetch attempts are automatically retried at regular intervals.
- Errors are caught and logged, preventing the plugin from crashing the application.

### Badge Support

News items can have badges associated with them, allowing for visual categorization or highlighting of certain items.

### Customizable Fetch Intervals

The plugin allows customization of two key intervals:

- `mainInterval`: Controls how often the plugin checks for updates and retries failed fetches.
- `fetchInterval`: Determines how frequently the plugin fetches new data from the remote service.

## Components

### NewsfeedNavButton

The main UI component that renders a button in the OpenSearch Dashboards header. When clicked, it opens a flyout containing news items.

### NewsfeedFlyout

Displays the list of news items in a flyout panel. It includes:

- A header with the title "What's new at OpenSearch"
- A scrollable list of news items
- A footer with a close button and version information

### NewsEmptyPrompt

Displayed when there are no news items to show.

### NewsLoadingPrompt

Shown while news items are being fetched.

## API and Data Flow

1. The `NewsfeedApiDriver` class handles communication with the news service:

   - `fetchNewsfeedItems`: Fetches news items from the remote service
   - `modelItems`: Processes the raw API response into a usable format
   - `validateItem`: Ensures each news item has all required fields

2. The `getApi` function creates an Observable that:

   - Fetches news items at regular intervals
   - Filters out expired or pre-published items
   - Determines if there are new items since the last fetch

3. The `NewsfeedPublicPlugin` class:
   - Initializes the plugin and its configuration
   - Sets up the API Observable
   - Mounts the `NewsfeedNavButton` component in the OpenSearch Dashboards header

## Internationalization

The plugin supports multiple languages:

- News items can have content in different languages
- The UI uses OpenSearch Dashboards' i18n system for localized strings
- If a user's preferred language is not available, it falls back to English

## Storage and Caching

The plugin uses browser storage to optimize performance and track new items:

- `sessionStorage` stores the last fetch time
- `localStorage` stores hashes of previously seen news items

## Usage

To use the Newsfeed plugin in OpenSearch Dashboards:

1. Ensure the plugin is enabled in the OpenSearch Dashboards configuration.
2. The news button will appear in the top-right corner of the OpenSearch Dashboards interface.
3. Click the button to open the newsfeed flyout and view the latest news items.

To create a custom newsfeed for a specific endpoint:

```typescript
const newsfeed$ = newsfeedStart.createNewsFeed$(NewsfeedApiEndpoint.SECURITY_SOLUTION);
```

## Development

To extend or modify the Newsfeed plugin:

1. The plugin is written in TypeScript and React.
2. Use the `NewsfeedPublicPlugin` class as the main entry point for customization.
3. Modify the `NewsfeedNavButton` and `NewsfeedFlyout` components to change the UI.
4. Adjust the `NewsfeedApiDriver` to change how news items are fetched and processed.
5. Update the configuration schema in `config.ts` to add or modify plugin options.

When developing:

- Use the `NEWSFEED_DEV_SERVICE_BASE_URL` for testing with a development news service.
