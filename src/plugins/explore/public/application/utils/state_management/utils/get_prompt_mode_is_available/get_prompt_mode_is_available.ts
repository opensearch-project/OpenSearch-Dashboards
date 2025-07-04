/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../../../../../../../data/common';
import { ExploreServices } from '../../../../../types';

export const getPromptModeIsAvailable = async (
  services: ExploreServices,
  dataset: Dataset
): Promise<boolean> => {
  try {
    const extensions = services.data.query.queryString
      .getLanguageService()
      .getQueryEditorExtensionMap();

    // Check if query assist is available through data plugin extension system
    if (!extensions['query-assist']) {
      return false;
    }

    // check if agent is available
    const response: { configuredLanguages: string[] } = await services.http.get(
      '/api/enhancements/assist/languages',
      {
        query: { dataSourceId: dataset.dataSource?.id },
      }
    );

    return !!response.configuredLanguages.length;
  } catch (error) {
    // Fallback to false
    return false;
  }
};
