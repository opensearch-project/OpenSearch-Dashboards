/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileParserService } from '../parsers/file_parser_service';
import { OpenSearchClient, RequestHandlerContext } from '../../../../core/server';

export const decideClient = async (
  dataSourceEnabled: boolean,
  context: RequestHandlerContext,
  dataSourceId?: string
): Promise<OpenSearchClient> => {
  return dataSourceEnabled && dataSourceId
    ? await context.dataSource.opensearch.getClient(dataSourceId)
    : context.core.opensearch.client.asCurrentUser;
};

export const validateEnabledFileTypes = (fileTypes: string[], fileParsers: FileParserService) => {
  const nonRegisteredFileTypes = fileTypes.filter(
    (fileType) => !fileParsers.hasFileParserBeenRegistered(fileType)
  );
  if (nonRegisteredFileTypes.length > 0) {
    throw new Error(
      `The following enabledFileTypes are not registered: ${nonRegisteredFileTypes.join(', ')}`
    );
  }
};
