/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { firstValueFrom } from '@osd/std';
import { ExploreServices } from '../../../types';
import { QueryEditorExtensionDependencies } from '../../../../../data/public';

export const getPromptModeIsAvailable = async (services: ExploreServices): Promise<boolean> => {
  try {
    const extensions = services.data.query.queryString
      .getLanguageService()
      .getQueryEditorExtensionMap();

    // Check if query assist is available through data plugin extension system
    const queryAssistExtension = extensions['query-assist'];
    if (!queryAssistExtension) {
      return false;
    }

    return await firstValueFrom(
      queryAssistExtension.isEnabled$({} as QueryEditorExtensionDependencies)
    );
  } catch (error) {
    return false;
  }
};
