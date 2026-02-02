/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationRegistry } from '../components/visualizations/visualization_registry';
import { VisualizationRule } from '../components/visualizations/types';

/**
 * Service interface for the visualization registry
 * This service allows plugins to register their own visualization rules
 */
export interface VisualizationRegistryServiceSetup {
  /**
   * Register a new visualization rule
   * @param rule The visualization rule to register
   */
  registerRule: (rule: VisualizationRule) => void;

  /**
   * Register multiple visualization rules
   * @param rules The visualization rules to register
   */
  registerRules: (rules: VisualizationRule[]) => void;
}

export interface VisualizationRegistryServiceStart {
  /**
   * Register a new visualization rule
   * @param rule The visualization rule to register
   */
  registerRule: (rule: VisualizationRule) => void;

  /**
   * Register multiple visualization rules
   * @param rules The visualization rules to register
   */
  registerRules: (rules: VisualizationRule[]) => void;

  /**
   * Get all registered visualization rules
   */
  getRules: () => VisualizationRule[];
}

export class VisualizationRegistryService {
  private readonly registry: VisualizationRegistry;

  constructor() {
    this.registry = new VisualizationRegistry();
  }

  public setup(): VisualizationRegistryServiceSetup {
    return {
      registerRule: (rule: VisualizationRule) => {
        this.registry.registerRule(rule);
      },
      registerRules: (rules: VisualizationRule[]) => {
        this.registry.registerRules(rules);
      },
    };
  }

  public start(): VisualizationRegistryServiceStart {
    return {
      registerRule: (rule: VisualizationRule) => {
        this.registry.registerRule(rule);
      },
      registerRules: (rules: VisualizationRule[]) => {
        this.registry.registerRules(rules);
      },
      getRules: () => {
        return this.registry.getRules();
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
