/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  visualizationRegistry,
  VisualizationRegistry,
} from '../components/visualizations/visualization_registry';
import { VisualizationType } from '../components/visualizations/utils/use_visualization_types';
import { createAreaConfig } from '../components/visualizations/area/area_vis_config';
import { createBarConfig } from '../components/visualizations/bar/bar_vis_config';
import { createBarGaugeConfig } from '../components/visualizations/bar_gauge/bar_gauge_vis_config';
import { createGaugeConfig } from '../components/visualizations/gauge/gauge_vis_config';
import { createHeatmapConfig } from '../components/visualizations/heatmap/heatmap_vis_config';
import { createHistogramConfig } from '../components/visualizations/histogram/histogram_vis_config';
import { createLineConfig } from '../components/visualizations/line/line_vis_config';
import { createMetricConfig } from '../components/visualizations/metric/metric_vis_config';
import { createPieConfig } from '../components/visualizations/pie/pie_vis_config';
import { createStateTimelineConfig } from '../components/visualizations/state_timeline/state_timeline_config';
import { createScatterConfig } from '../components/visualizations/scatter/scatter_vis_config';
import { createTableConfig } from '../components/visualizations/table/table_vis_config';

/**
 * Service interface for the visualization registry
 * This service allows plugins to register their own visualization rules
 */
export interface VisualizationRegistryServiceSetup {
  /**
   * Register a new visualization
   */
  registerVisualization: (
    visualization: VisualizationType<any> | Array<VisualizationType<any>>
  ) => void;
}

export interface VisualizationRegistryServiceStart {
  /**
   * Register a new visualization
   */
  registerVisualization: (visualization: VisualizationType<any>) => void;

  /**
   * Get a visualization by type
   */
  getVisualization: (chartType: string) => VisualizationType<any> | undefined;
}

export class VisualizationRegistryService {
  private readonly registry: VisualizationRegistry;

  constructor() {
    // TODO: refactor this to not rely on this visualizationRegistry singleton
    this.registry = visualizationRegistry;
    this.registry.registerVisualization([
      createAreaConfig(),
      createBarConfig(),
      createBarGaugeConfig(),
      createGaugeConfig(),
      createHeatmapConfig(),
      createHistogramConfig(),
      createLineConfig(),
      createMetricConfig(),
      createPieConfig(),
      createScatterConfig(),
      createStateTimelineConfig(),
      createTableConfig(),
    ]);
  }

  public setup(): VisualizationRegistryServiceSetup {
    return {
      registerVisualization: (visualization) => {
        this.registry.registerVisualization(visualization);
      },
    };
  }

  public start(): VisualizationRegistryServiceStart {
    return {
      registerVisualization: (visualization) => {
        this.registry.registerVisualization(visualization);
      },
      getVisualization: (chartType) => {
        return this.registry.getVisualization(chartType);
      },
    };
  }

  /**
   * Get the visualization registry instance
   */
  public getRegistry(): VisualizationRegistry {
    return this.registry;
  }
}
