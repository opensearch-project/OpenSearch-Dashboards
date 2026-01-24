# OpenSearch Dashboards Metric Recorder Plugin

Metric Recorder is a plugin to record metrics.

## How to use

1. Make sure `metricsRecorder` is in your optional Plugins:

    ```json
    // plugin/opensearch_dashboards.json
    {
      "id": "...",
      "optionalPlugins": ["metricsRecorder"]
    }
    ```

2. Register Metrics recorder in the `setup` function:

    ```ts
    // public/plugin.ts
    import { MetricsRecorderSetup } from 'src/plugins/metrics_recorder/server';
    import { CoreSetup, CoreStart } from 'opensearch-dashboards/server';

    class Plugin {
      public setup(core: CoreSetup, plugins: { metricsRecorder?: MetricsRecorderSetup }) {
        metricsRecorder?.recordCount('app', 'metric', 1);
      }

      public start(core: CoreStart) {}
    }
    ```

3. Register a MetricsReporterFactory to handle reported metrics.
    ```ts
    // server/plugin.ts
    import { MetricsRecorderSetup } from 'src/plugins/metrics_recorder/server';
    import { CoreSetup, CoreStart } from 'opensearch-dashboards/server';

    class Plugin {
      private metricsRecorder: CustomizedMetricsRecorder;

      public setup(core: CoreSetup, plugins: { metricsRecorder?: MetricsRecorderSetup }) {
        metricsRecorder?.setMetricsRecorderFactory(() => metricsRecorder);
      }

      public start(core: CoreStart) {}
    }
    ```

# Routes registered by this plugin

- `/api/metrics_recorder/report`: Used by MetricsRecorder instances to report metrics to the server
