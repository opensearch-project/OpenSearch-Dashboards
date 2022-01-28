/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { IndexPatternField } from '../../../../../../data/public';

export function getWarnings(field: IndexPatternField) {
  let warnings = [];

  if (field.scripted) {
    warnings.push(
      i18n.translate(
        'discover.fieldChooser.discoverField.scriptedFieldsTakeLongExecuteDescription',
        {
          defaultMessage: 'Scripted fields can take a long time to execute.',
        }
      )
    );
  }

  if (warnings.length > 1) {
    warnings = warnings.map(function (warning, i) {
      return (i > 0 ? '\n' : '') + (i + 1) + ' - ' + warning;
    });
  }

  return warnings;
}
