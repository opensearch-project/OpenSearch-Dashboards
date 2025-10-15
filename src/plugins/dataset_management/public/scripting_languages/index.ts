/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import { HttpStart, NotificationsStart } from 'src/core/public';

export function getSupportedScriptingLanguages(): string[] {
  return ['painless'];
}

export function getDeprecatedScriptingLanguages(): string[] {
  return [];
}

export const getEnabledScriptingLanguages = (
  http: HttpStart,
  toasts: NotificationsStart['toasts']
) =>
  http.get('/api/opensearch-dashboards/scripts/languages').catch(() => {
    toasts.addDanger(
      i18n.translate('datasetManagement.scriptingLanguages.errorFetchingToastDescription', {
        defaultMessage: 'Error getting available scripting languages from OpenSearch',
      })
    );

    return [];
  });
