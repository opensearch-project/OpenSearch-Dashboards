/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLQueryBuilder } from './query_builder/ppl_query_builder';
import { PPLQueryParser } from './query_parser/ppl_query_parser';

export class QueryManager {
  queryBuilder(): PPLQueryBuilder {
    return new PPLQueryBuilder();
  }

  queryParser(): PPLQueryParser {
    return new PPLQueryParser();
  }
}
