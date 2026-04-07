/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PanelDefinition, VisualizationType, GridPosition } from '../types';
import { Query } from './query';

/**
 * Fluent builder for panel definitions.
 */
export class Panel {
  private readonly _name: string;
  private _visualization: VisualizationType = 'line';
  private _gridPosition: GridPosition = { x: 0, y: 0, w: 12, h: 8 };
  private _query?: Query;
  private _options: Record<string, unknown> = {};

  private constructor(name: string) {
    this._name = name;
  }

  /**
   * Create a new panel builder with the given name.
   */
  static create(name: string): Panel {
    return new Panel(name);
  }

  /**
   * Set the visualization type.
   */
  visualization(type: VisualizationType): Panel {
    this._visualization = type;
    return this;
  }

  /**
   * Set the grid position of the panel.
   */
  gridPosition(position: GridPosition): Panel {
    this._gridPosition = { ...position };
    return this;
  }

  /**
   * Set the query for this panel.
   */
  query(q: Query): Panel {
    this._query = q;
    return this;
  }

  /**
   * Set an individual option key-value pair.
   */
  option(key: string, value: unknown): Panel {
    this._options[key] = value;
    return this;
  }

  /**
   * Build and return the panel definition.
   */
  build(): PanelDefinition {
    return {
      name: this._name,
      type: 'visualization',
      visualization: this._visualization,
      gridPosition: { ...this._gridPosition },
      query: this._query ? this._query.build() : undefined,
      options: { ...this._options },
    };
  }
}
