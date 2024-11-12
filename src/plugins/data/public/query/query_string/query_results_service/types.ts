/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import { PublicMethodsOf } from "packages/osd-utility-types/target";
import { QueryResultService } from "./query_result_service";
import { Query } from "../../../../common";

export interface QueryResultExtensionConfig {
  /**
   * The id for the discover results extension.
   */
  id: string;
  /**
   * Lower order indicates higher position on UI.
   */
  order: number;
  /**
   * A function that returns the discover results extension banner. The banner is a
   * component that will be displayed above the results.
   * @param dependencies - The dependencies required for the extension.
   * @returns The component to display the banner.
   */
  getBanner?: (dependencies: QueryResultExtensionDependencies) => React.ReactElement | null;
}

export interface QueryResultExtensionDependencies {
  query: Query;
  queryStatus: string;
}

export interface QueryResultEnhancements {
  queryResultExtension?: QueryResultExtensionConfig;
}

export type QueryResultServiceContract = PublicMethodsOf<QueryResultService>;