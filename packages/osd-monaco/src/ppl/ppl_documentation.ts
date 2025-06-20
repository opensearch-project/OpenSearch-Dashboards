/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Get appropriate documentation link based on PPL error message
 */
export const getPPLDocumentationLink = (errorMessage: string): { title: string; url: string } => {
  const message = errorMessage.toLowerCase();

  // General PPL documentation
  return {
    title: 'PPL Documentation',
    url: 'https://opensearch.org/docs/latest/search-plugins/ppl/index/',
  };
};
