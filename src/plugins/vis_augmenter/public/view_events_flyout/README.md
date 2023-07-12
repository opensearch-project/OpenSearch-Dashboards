## View Events Flyout

### Overview

This flyout provides a detailed view of all `VisLayer`s associated to a particular visualization. It consists of two main portions:

1. The top portion showing the base visualization, and the contextual time range that can be refreshed to fetch any new data in real time
2. The bottom portion showing a breakdown of each `VisLayer`, organized first by origin plugin (e.g., "Anomaly Detection"), and then by each plugin resource (e.g., "Anomaly Detector"). Each chart represents results produced from a single plugin resource. The resource name will also be a link, directing the user to the resource's details page within its respective plugin.

### Improvements

Currently, the charts rendered within this flyout are utilizing the `embeddables` plugin to re-create the source visualization, as well as data filtering and other visual changes, based on what is being rendered. Ideally, this can be decoupled from `embeddables` entirely, and the charts can all be rendered directly using expression renderers. This can help clean up and remove dependencies across plugins, as well as being able to remove the `VisAugmenterEmbeddableConfig` that has been added to `VisualizeEmbeddable` in order to persist some of the needed visual changes to the charts.

For more details on this, see the [GitHub issue](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4483).
