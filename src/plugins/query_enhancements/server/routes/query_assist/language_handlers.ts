/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger, OpenSearchDashboardsRequest, RequestHandlerContext } from 'src/core/server';
import { promqlHandler } from './promql/metadata_utils';

/**
 * Context passed to language handlers for fetching additional parameters.
 */
export interface LanguageHandlerContext {
  context: RequestHandlerContext;
  request: OpenSearchDashboardsRequest;
  dataSourceName: string;
  logger: Logger;
}

/**
 * Interface for language-specific handlers.
 * Each language can implement this to provide custom behavior for query generation.
 */
export interface LanguageHandler {
  /**
   * Fetches additional parameters to include in the agent request.
   * For example, PROMQL fetches metrics metadata to provide context to the LLM.
   * Returns an empty object if no additional parameters are needed.
   */
  getAdditionalAgentParameters: (
    handlerContext: LanguageHandlerContext
  ) => Promise<Record<string, string>>;
}

const defaultHandler: LanguageHandler = {
  getAdditionalAgentParameters: async () => ({}),
};

const languageHandlers: Record<string, LanguageHandler> = {
  PROMQL: promqlHandler,
};

export const registerLanguageHandler = (language: string, handler: LanguageHandler): void => {
  languageHandlers[language] = handler;
};

export const getLanguageHandler = (language: string): LanguageHandler => {
  return languageHandlers[language] || defaultHandler;
};
