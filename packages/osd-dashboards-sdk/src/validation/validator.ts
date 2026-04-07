/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DashboardDefinition,
  ValidationError,
  VisualizationType,
  QueryLanguage,
  GridPosition,
} from '../types';

const VALID_VISUALIZATION_TYPES: VisualizationType[] = [
  'line',
  'bar',
  'pie',
  'heatmap',
  'table',
  'metric',
  'markdown',
  'area',
  'gauge',
];

const VALID_QUERY_LANGUAGES: QueryLanguage[] = ['PPL', 'DQL', 'SQL', 'Lucene'];

/**
 * Validates a DashboardDefinition against a set of rules.
 */
export class Validator {
  /**
   * Validate a dashboard definition and return any errors found.
   */
  static validate(definition: DashboardDefinition): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required top-level fields
    if (!definition.apiVersion) {
      errors.push({ path: 'apiVersion', message: 'apiVersion is required' });
    }

    if (!definition.kind) {
      errors.push({ path: 'kind', message: 'kind is required' });
    }

    // Metadata checks
    if (!definition.metadata) {
      errors.push({ path: 'metadata', message: 'metadata is required' });
    } else if (!definition.metadata.name || definition.metadata.name.trim().length === 0) {
      errors.push({ path: 'metadata.name', message: 'metadata.name is required' });
    }

    // Spec checks
    if (!definition.spec) {
      errors.push({ path: 'spec', message: 'spec is required' });
      return errors;
    }

    // Title is required
    if (!definition.spec.title || definition.spec.title.trim().length === 0) {
      errors.push({ path: 'spec.title', message: 'Dashboard title is required' });
    }

    // At least one panel is required
    if (!definition.spec.panels || definition.spec.panels.length === 0) {
      errors.push({ path: 'spec.panels', message: 'At least one panel is required' });
    } else {
      // Validate each panel
      for (let i = 0; i < definition.spec.panels.length; i++) {
        const panel = definition.spec.panels[i];
        const panelPath = `spec.panels[${i}]`;

        if (!panel.name || panel.name.trim().length === 0) {
          errors.push({ path: `${panelPath}.name`, message: 'Panel name is required' });
        }

        if (
          !panel.visualization ||
          !VALID_VISUALIZATION_TYPES.includes(panel.visualization as VisualizationType)
        ) {
          errors.push({
            path: `${panelPath}.visualization`,
            message: `Invalid visualization type: "${panel.visualization}". Must be one of: ${VALID_VISUALIZATION_TYPES.join(', ')}`,
          });
        }

        // Validate grid position
        if (!panel.gridPosition) {
          errors.push({
            path: `${panelPath}.gridPosition`,
            message: 'Grid position is required',
          });
        } else {
          const { x, y, w, h } = panel.gridPosition;
          if (x < 0 || y < 0 || w <= 0 || h <= 0) {
            errors.push({
              path: `${panelPath}.gridPosition`,
              message: 'Grid position values must be non-negative, and width/height must be positive',
            });
          }
        }

        // Validate query if present
        if (panel.query) {
          if (
            !panel.query.language ||
            !VALID_QUERY_LANGUAGES.includes(panel.query.language as QueryLanguage)
          ) {
            errors.push({
              path: `${panelPath}.query.language`,
              message: `Invalid query language: "${panel.query.language}". Must be one of: ${VALID_QUERY_LANGUAGES.join(', ')}`,
            });
          }
          if (!panel.query.query || panel.query.query.trim().length === 0) {
            errors.push({
              path: `${panelPath}.query.query`,
              message: 'Query string must not be empty',
            });
          }
        }
      }

      // Check for overlapping panels
      const overlaps = Validator.findOverlappingPanels(
        definition.spec.panels.map((p) => p.gridPosition)
      );
      for (const [a, b] of overlaps) {
        errors.push({
          path: `spec.panels`,
          message: `Panel at index ${a} overlaps with panel at index ${b}`,
        });
      }
    }

    return errors;
  }

  /**
   * Check whether a dashboard definition is valid.
   */
  static isValid(definition: DashboardDefinition): boolean {
    return Validator.validate(definition).length === 0;
  }

  /**
   * Find overlapping panel pairs by grid position.
   * Returns array of [indexA, indexB] tuples.
   */
  private static findOverlappingPanels(positions: GridPosition[]): [number, number][] {
    const overlaps: [number, number][] = [];

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (Validator.rectsOverlap(positions[i], positions[j])) {
          overlaps.push([i, j]);
        }
      }
    }

    return overlaps;
  }

  /**
   * Check if two rectangles overlap.
   */
  private static rectsOverlap(a: GridPosition, b: GridPosition): boolean {
    // No overlap if one is entirely to the left, right, above, or below the other
    if (a.x + a.w <= b.x) return false;
    if (b.x + b.w <= a.x) return false;
    if (a.y + a.h <= b.y) return false;
    if (b.y + b.h <= a.y) return false;
    return true;
  }
}
