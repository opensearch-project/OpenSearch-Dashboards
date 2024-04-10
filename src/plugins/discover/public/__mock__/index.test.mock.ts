/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class MockS3DataSource {
  protected name: string;
  protected type: string;
  protected metadata: any;

  constructor({ name, type, metadata }: { name: string; type: string; metadata: any }) {
    this.name = name;
    this.type = type;
    this.metadata = metadata;
  }

  async getDataSet(dataSetParams?: any) {
    return [this.name];
  }

  getName() {
    return this.name;
  }

  getType() {
    return this.type;
  }
}
