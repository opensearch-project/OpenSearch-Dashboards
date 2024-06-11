## Vis Augmenter

### Overview

The feature introduced in [#4361](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4361) allows for plugins to be able to display additional data on a visualization. The framework for how that is done, including all of the interfaces, type definitions, helper functions, and services used, are maintained in this plugin. It also registers new saved object types and expression types that plugins use to standardize how data is formatted and visualized on the charts.

### Eligibility

Currently, this augmenting framework is only eligible for line visualizations, with a single date histogram x axis. There is future plans to expand this to other types of visualizations, as well as other ways that visualizations may be augmented, such as overlaying forecasting data.

### Framework

The main idea is that plugins can hook into the render lifecycle of a visualization, such that when the original source datapoints are being fetched, plugins can also fetch data. All of this can then be combined and visualized cohesively on a chart. This process can be broken down into a few main steps:

1. Plugins implement a way to associate a plugin resource to a visualization. In the background, this means creating an `augment-vis` saved object linking the two.
2. Vis Augmenter will fetch any `augment-vis` objects that reference a particular visualization.
3. Vis Augmenter will run the plugin-registered expression function, along with any arguments, that is persisted in the saved object.
4. Vis Augmenter will combine all of the `VisLayer` results from the expression functions.
5. Vis Augmenter will update the source datatable with every `VisLayer`, dependent on the specific `VisLayer` type.
6. Visualization is rendered with the original data & augmented plugin data.

### `augment-vis` saved object

This is a new saved object type introduced with the primary purpose of maintaining an association of a plugin resource (e.g., anomaly detector, alerting monitor) to a visualization. It also contains the plugin-registered expression function that will be executed when fetching data for that particular resource, when rendering the visualization. The advantages of using saved objects to maintain these relationships is it keeps this relationship strictly a Dashboards-only feature, without coupling anything with the objects stored in OpenSearch. It also lets us use the concept of multitenancy to isolate these associations across different tenants.

### `VisLayer`s

`VisLayer` is the generic interface for a type of augmentation done on a visualization. The main idea is any plugin can hook into the rendering workflow of a visualization and have it fetch `VisLayer`s. This plugin will handle the processing of `VisLayer`s of different types, and how each type will be rendered consistently on a visualization. Currently, the only introduced one is `PointInTimeEventsVisLayer`. This will render a red triangle event datapoint below a source visualization, aligned with the visualization's temporal axis.

### View events flyout

This is the primary UI for providing a more detailed view on `VisLayer`s for a particular visualization. See the corresponding [README](src/plugins/vis_augmenter/public/view_events_flyout/README.md) for details.

### The `stats` API

There is a new server-side `stats` API which can be used for retrieving feature usage metrics. It gathers all of the `augment-vis` saved objects and aggregates them to get an idea of how many associations are created between which plugins and which visualizations. For more details on the API, see the [PR](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4006).

Example usage:

```
curl localhost:5601/api/vis_augmenter/stats
{
  "total_objs": 2,
  "obj_breakdown": {
    "origin_plugin": { "anomalyDetectionDashboards": 2 },
    "plugin_resource_type": { "Anomaly Detectors": 2 },
    "plugin_resource_id": { "detector-1-id": 1, "detector-2-id": 1 },
    "visualization_id": { "visualization-1-id": 2 }
  }
}
```

### Settings

The feature can be toggled on/off entirely through the `vis_augmenter.pluginAugmentationEnabled` setting in the `opensearch_dashboards.yml` config file. If enabled, there are additional fields that can be set in the advanced settings:
`visualization.enablePluginAugmentation` to toggle the feature on/off.
`visualization.enablePluginAugmentation.maxPluginObjects` to adjust the number of associations allowed per visualization. For example, to keep users from creating too many plugin resources and associations to visualizations, this value can be lowered.

For more details, see the [PR](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3961).

### Steps for plugin integration

For an external plugin to utilize the Vis Augmenter plugin and its rendering framework, there are a few main steps needed:

1. Provide UX for handling associations between a visualization and plugin resources. There are examples in [Anomaly Detection](https://github.com/opensearch-project/anomaly-detection-dashboards-plugin/issues/400) and [Alerting](https://github.com/opensearch-project/alerting-dashboards-plugin/issues/457). This is where the bulk of the effort is needed. While there is no very strict requirements, there should be UX flows for creating, adding, and removing associated plugin resources to the visualization. Behind-the-scenes, this means making saved object API calls to handle CRUD operations of the `augment-vis` saved objects. Another important part is implementing & registering a `UIAction` so that there is a visible option under the visualization context menu to maintain associations. This is the current way that Anomaly Detection and Alerting inject their UX components into core Dashboards.

   > It is worth calling out that currently there is no other registration being done by the plugins to potentially leverage common UX components or user flows, such as what's done in the Saved Objects Management plugin for different saved object types. There is improvements that can be done to decrease plugin responsibility and prevent duplicate code by persisting a lot of these common flows within Vis Augmenter. Given that this is an initial release with a lot of uncertainty on how the flows may differ across plugins, or what becomes the most important or common user flows, this was left as an open item for now.

2. Implement & register an expression function of type `vis_layers` that will fetch plugin data and format it into a `VisLayer`. This is what will be executed when a visualization is rendered and all of the chart's source data is being retrieved. It is important that the function does not simply return its own `VisLayer` result, but rather appends it to the list of input `VisLayer`s. By following this pattern, it allows any number of plugins to execute any number of functions in any sequence, to all produce the same final set of `VisLayer`s for a particular visualization. For an example function, check out Anomaly Detection's [overlay_anomalies](https://github.com/opensearch-project/anomaly-detection-dashboards-plugin/blob/main/public/expressions/overlay_anomalies.ts).

3. Define constant values to be included in the `augment-vis` saved objects. For example, all objects from a particular plugin should have consistent values for `originPlugin`, `expressionFn`, and `pluginEventType`, as well as follow a consistent pattern for populating `pluginResource` values, such as `urlPath`. For details on each specific field, see [here](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/vis_augmenter/public/types.ts). For an example, check out constants used by the Anomaly Detection plugin [here](https://github.com/opensearch-project/anomaly-detection-dashboards-plugin/blob/main/public/expressions/constants.ts).
