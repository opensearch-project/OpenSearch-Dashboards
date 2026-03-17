/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  visualizationRegistry,
  VisualizationRegistry,
} from '../components/visualizations/visualization_registry';
import { VisualizationType } from '../components/visualizations/utils/use_visualization_types';

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
