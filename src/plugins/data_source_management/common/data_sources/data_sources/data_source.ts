/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceSpec, IDataSource, SavedObjectsClientCommon } from '../types';

interface DataSourceDeps {
  spec?: DataSourceSpec;
  savedObjectsClient: SavedObjectsClientCommon;
}

interface SavedObjectBody {
  title?: string;
  type?: string;
}

export class DataSource implements IDataSource {
  public id?: string;
  public title: string = '';
  public type: string | undefined;
  public endpoint: string = '';

  constructor({ spec = {} }: DataSourceDeps) {
    this.id = spec.id;
    this.title = spec.title || '';
    this.type = spec.type;
    this.endpoint = spec.endpoint || '';
  }
}
