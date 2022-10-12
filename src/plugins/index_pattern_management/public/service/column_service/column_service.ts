/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPatternTableColumn } from '../../types';

export interface IndexPatternTableColumnServiceSetup {
  /**
   * register given column in the registry.
   */
  register: (column: IndexPatternTableColumn<unknown>) => void;
}

export interface IndexPatternTableColumnServiceStart {
  /**
   * return all {@link IndexPatternTableColumn | columns} currently registered.
   */
  getAll: () => Array<IndexPatternTableColumn<unknown>>;
}

export class IndexPatternTableColumnService {
  private readonly columns = new Map<string, IndexPatternTableColumn<unknown>>();

  setup(): IndexPatternTableColumnServiceSetup {
    return {
      register: (column) => {
        if (this.columns.has(column.id)) {
          throw new Error(`Index Pattern Table Column with id '${column.id}' already exists`);
        }
        this.columns.set(column.id, column);
      },
    };
  }

  start(): IndexPatternTableColumnServiceStart {
    return {
      getAll: () => [...this.columns.values()],
    };
  }
}
