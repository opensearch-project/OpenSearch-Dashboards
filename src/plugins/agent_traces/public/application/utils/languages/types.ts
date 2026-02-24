/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../data/common';

export type QueryWithQueryAsString = Omit<Query, 'query'> & {
  query: string;
};
