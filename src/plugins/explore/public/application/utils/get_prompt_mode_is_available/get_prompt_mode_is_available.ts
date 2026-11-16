/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { firstValueFrom } from '@osd/std';
import { ExploreServices } from '../../../types';
import { QueryEditorExtensionDependencies } from '../../../../../data/public';

export const getPromptModeIsAvailable = async (
  services: ExploreServices,
  options?: { signal?: AbortSignal }
): Promise<boolean> => {
  try {
    const signal = options?.signal;
    if (signal?.aborted) {
      return false;
    }

    const extensions = services.data.query.queryString
      .getLanguageService()
      .getQueryEditorExtensionMap();

    // Check if query assist is available through data plugin extension system
    const queryAssistExtension = extensions['query-assist'];
    if (!queryAssistExtension) {
      return false;
    }

    const enabled$ = queryAssistExtension.isEnabled$({} as QueryEditorExtensionDependencies);
    // Aborting completes the stream without a value, so firstValueFrom throws and we return false.
    return await firstValueFrom(
      signal ? enabled$.pipe(takeUntil(fromEvent(signal, 'abort'))) : enabled$
    );
  } catch (error) {
    return false;
  }
};
