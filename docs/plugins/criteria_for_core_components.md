# Establishing Criteria for Core vs Non-Core Components

## Overview
As OpenSearch Dashboards continues to grow, we need clear criteria to determine what should be included in core versus non-core components. This decision framework will help maintain a focused, maintainable core(OpenSearch Dashboards repo) while allowing for robust plugin ecosystem development.

## Current Challenge
The lack of clear criteria for classifying components as core or non-core has led to:
- Inconsistent decision-making across different features and plugins
- Potential bloat in core components
- Uncertainty in plugin development and maintenance strategies
- unclear goal for minimal distribution
  - The minimal distribution is primarily used in CI environments. For production deployments, all builds include all second-party plugins (plugins under opensearch-project).◊

## Proposed Criteria for Core Components

A component should be considered "core" if it meets the following criteria:

### 1. Essential Functionality
- Necessary for fundamental platform capabilities, aka required by core plugins / more than 2 external plugins, like saved objects management, embeddable, data plugin.
- Platform application frameworks. These are common interfaces that are suited for various usecases and should support customizations based on usecases, E.g. Dashboards, Discover, Visualize. The function of the application should not rely on any service from external plugins, and work well with minimal distribution of OpenSearch.
- Handles system-wide state management, like advanced settings

### 2. Security and Compliance
- Implements critical security features
- Handles authentication/authorization fundamentals

### 3. Performance Impact
- Critical for baseline performance
- Required for initial page load and basic navigation
- Essential for system stability

## Criteria for Non-Core Components

> Generally, non-core components are components that don't meet the criteria for core components, with some examples being: traces / alerting.

Components should be non-core if they:

1. Serve specific use cases rather than general purposes, e.g. APM, traces
2. Can be loaded on-demand without impacting basic functionality
3. Have specialized dependencies not required by other components
4. Have dependency on external backend plugin

## Questions for Discussion

1. How should we handle components that partially fulfill core requirements? Should we implement a scoring system with individual criteria ratings?

## References
- Related discussion: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9806

Please share your thoughts and suggestions on these criteria. The goal is to establish a clear, objective framework that can guide our decisions moving forward.
