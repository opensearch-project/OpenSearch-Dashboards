# Discover Traces (Experimental)

## Overview

### Query trace data with Discover Traces

Built on the Discover interface and new in 3.3, Discover Traces provides a central interface for querying and exploring traces across large distributed systems. Traces includes a click-to-filter interface, allowing construction of complex PPL queries without having to write them. When a trace requires deeper investigation, a new trace details page reveals individual trace journeys, displaying complete metadata, attributes, and execution context for that specific operation. To activate this functionality, please refer to the step-by-step guide here.

### Explore interactive node-based visualizations with React Flow

3.3 adds the React Flow library to OpenSearch Dashboards core as an experimental feature, providing a standardized framework for interactive node-based visualizations. This integration eliminates version conflicts that occurred when individual plugins bundled copies of the library, providing a consistent user experience. The library is currently being used with the Discover: Traces feature to render service maps that visualize trace spans and service dependencies. Unlike traditional charting libraries, React Flow specializes in workflow and network diagrams, offering drag-and-drop interactions, custom node components, and efficient rendering of thousands of nodes while maintaining accessibility compliance. To activate this functionality, please refer to the step-by-step guide here.

## Setup

You should follow the steps from the [Explore setup guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/explore/README.md) to create the datasource and workspace first.