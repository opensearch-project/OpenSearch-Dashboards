/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VariableDefinition } from '../types';

/**
 * Fluent builder for template variable definitions.
 */
export class Variable {
  private readonly _name: string;
  private _type: VariableDefinition['type'] = 'custom';
  private _label?: string;
  private _description?: string;
  private _query?: string;
  private _options?: string[];
  private _defaultValue?: string;
  private _multi: boolean = false;

  private constructor(name: string) {
    this._name = name;
  }

  /**
   * Create a new variable builder with the given name.
   */
  static create(name: string): Variable {
    return new Variable(name);
  }

  /**
   * Set the variable type.
   */
  type(type: VariableDefinition['type']): Variable {
    this._type = type;
    return this;
  }

  /**
   * Set the display label.
   */
  label(label: string): Variable {
    this._label = label;
    return this;
  }

  /**
   * Set the description.
   */
  description(description: string): Variable {
    this._description = description;
    return this;
  }

  /**
   * Set the query used to populate options (for query-type variables).
   */
  query(query: string): Variable {
    this._query = query;
    return this;
  }

  /**
   * Set the static options (for custom-type variables).
   */
  options(options: string[]): Variable {
    this._options = [...options];
    return this;
  }

  /**
   * Set the default value.
   */
  defaultValue(value: string): Variable {
    this._defaultValue = value;
    return this;
  }

  /**
   * Allow multiple selections.
   */
  multi(multi: boolean = true): Variable {
    this._multi = multi;
    return this;
  }

  /**
   * Build and return the variable definition.
   */
  build(): VariableDefinition {
    const def: VariableDefinition = {
      name: this._name,
      type: this._type,
    };

    if (this._label !== undefined) def.label = this._label;
    if (this._description !== undefined) def.description = this._description;
    if (this._query !== undefined) def.query = this._query;
    if (this._options !== undefined) def.options = [...this._options];
    if (this._defaultValue !== undefined) def.defaultValue = this._defaultValue;
    if (this._multi) def.multi = this._multi;

    return def;
  }
}
