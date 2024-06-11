/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
export class CustomApiSchemaRegistry {
  private readonly schemaRegistry: any[];

  constructor() {
    this.schemaRegistry = new Array();
  }

  public register(schema: any) {
    this.schemaRegistry.push(schema);
  }

  public getAll(): any[] {
    return this.schemaRegistry;
  }
}
