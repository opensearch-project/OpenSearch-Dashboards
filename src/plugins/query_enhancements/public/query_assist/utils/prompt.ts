/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { APPENDED_QUERY_PROMPT } from './constant';

export const appendQueryPrompt = (query: string) => {
  const queryLower = query.toLowerCase();
  // if the query includes these two words, we will append query manually
  if (queryLower.includes('fail') || queryLower.includes('error'))
    return query + APPENDED_QUERY_PROMPT;
  return query;
};
