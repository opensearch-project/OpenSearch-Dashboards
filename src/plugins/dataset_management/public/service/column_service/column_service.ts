/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetTableColumn } from '../../types';

export interface DatasetTableColumnServiceSetup {
  /**
   * register given column in the registry.
   */
  register: (column: DatasetTableColumn<unknown>) => void;
}

export interface DatasetTableColumnServiceStart {
  /**
   * return all {@link DatasetTableColumn | columns} currently registered.
   */
  getAll: () => Array<DatasetTableColumn<unknown>>;
}

export class DatasetTableColumnService {
  private readonly columns = new Map<string, DatasetTableColumn<unknown>>();

  setup(): DatasetTableColumnServiceSetup {
    return {
      register: (column) => {
        if (this.columns.has(column.id)) {
          throw new Error(`Index Pattern Table Column with id '${column.id}' already exists`);
        }
        this.columns.set(column.id, column);
      },
    };
  }

  start(): DatasetTableColumnServiceStart {
    return {
      getAll: () => [...this.columns.values()],
    };
  }
}
