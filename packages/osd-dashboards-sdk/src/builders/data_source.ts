/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceDefinition } from '../types';

/**
 * Fluent builder for data source definitions.
 */
export class DataSource {
  private readonly _name: string;
  private _type: string = 'opensearch';
  private _default: boolean = false;

  private constructor(name: string) {
    this._name = name;
  }

  /**
   * Create a new data source builder with the given name.
   */
  static create(name: string): DataSource {
    return new DataSource(name);
  }

  /**
   * Set the data source type.
   */
  type(type: string): DataSource {
    this._type = type;
    return this;
  }

  /**
   * Mark this data source as the default.
   */
  default(isDefault: boolean = true): DataSource {
    this._default = isDefault;
    return this;
  }

  /**
   * Build and return the data source definition.
   */
  build(): DataSourceDefinition {
    return {
      name: this._name,
      type: this._type,
      default: this._default,
    };
  }
}
