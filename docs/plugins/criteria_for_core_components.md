# Establishing Criteria for Core vs Non-Core Components

## Overview
As OpenSearch Dashboards continues to grow, we need clear criteria to determine what should be included in core versus non-core components. This decision framework will help maintain a focused, maintainable core while allowing for robust plugin ecosystem development.

## Current Challenge
The lack of clear criteria for classifying components as core or non-core has led to:
- Inconsistent decision-making across different features and plugins
- Potential bloat in core components
- Uncertainty in plugin development and maintenance strategies

## Proposed Criteria for Core Components

A component should be considered "core" if it meets the following criteria:

### 1. Essential Functionality
- Necessary for fundamental platform capabilities, like saved objects management, embeddable, data plugin.
- Platform application frameworks. These are common interfaces that are suited for various usecases and should support customizations based on usecases, E.g. Dashboards, Discover, Visualize. The function of the application should not rely on any service from external plugins, and work well with minimal distribution of OpenSearch.

### 2. Cross-cutting Concerns
- Provides services used by multiple other components, like navigation
- Implements critical infrastructure patterns, like workspace
- Handles system-wide state management, like advanced settings

### 3. Security and Compliance
- Implements critical security features
- Handles authentication/authorization fundamentals

### 4. Performance Impact
- Critical for baseline performance
- Required for initial page load and basic navigation
- Essential for system stability

## Criteria for Non-Core Components

Components should be non-core if they:

1. Serve specific use cases rather than general purposes, e.g. Security dashboard, APM, traces
2. Can be loaded on-demand without impacting basic functionality
3. Have specialized dependencies not required by other components

## Questions for Discussion

1. How should we handle components that partially meet core criteria? Do we need to add a bar and add score for each rule?

## References
- Related discussion: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9806

Please share your thoughts and suggestions on these criteria. The goal is to establish a clear, objective framework that can guide our decisions moving forward.
