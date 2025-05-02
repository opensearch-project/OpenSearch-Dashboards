# Explore Plugin (experimental)

This plugin is experimental and will change in future releases.

The Explore plugin represents an evolution of the Discover experience in OpenSearch Dashboards, providing enhanced query capabilities and multi-dataset support.

## Overview

This plugin introduces a query-driven data exploration experience while maintaining compatibility with the existing Discover functionality. It serves as a forward-looking replacement for Discover that will eventually become the primary data exploration interface.

## Why a New Plugin?

Creating a separate plugin instead of directly modifying Discover allows us to:

1. Prevent regression on the existing Discover plugin while implementing new features
2. Build a new architecture for a query-driven experience
3. Enable incremental adoption as users transition to the new experience

## Relationship to Other Plugins

### Discover Plugin
Explore builds upon Discover's core functionality while enhancing it with multi-dataset support and flexible query capabilities. Eventually, Explore will replace Discover entirely as a backward-compatible upgrade.

### Data Explorer Plugin
While Data Explorer provides a consolidated view of all data exploration tools, Explore focuses specifically on the search and analysis experience within that broader ecosystem.

## Running the Plugin

To run the Explore plugin:

```bash
yarn start:explore
```

## Future Plans

The long-term goal is for Explore to completely replace the Discover plugin. This transition will happen gradually while maintaining backward compatibility to ensure a smooth transition for users and developers who have built workflows around Discover.