/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import { QueryResultEnhancements, QueryResultExtensionConfig } from "./types";


export class QueryResultService {
  private queryResultsExtensionMap: Record<string, QueryResultExtensionConfig>;

  constructor() {
    this.queryResultsExtensionMap = {};
  }

  public __enhance = (enhancements: QueryResultEnhancements) => {
    if (enhancements.queryResultExtension) {
      this.queryResultsExtensionMap[enhancements.queryResultExtension.id] =
        enhancements.queryResultExtension;
    }
  };

  public getQueryResultExtensionMap = () => {
    return this.queryResultsExtensionMap;
  }
}