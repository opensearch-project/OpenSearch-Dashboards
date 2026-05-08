/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { IFieldType } from '../../../../../../plugins/data/public';

export function extractTimeFields(fields: IFieldType[]) {
  const dateFields = fields.filter((field) => field.type === 'date');
  const label = i18n.translate('datasetManagement.createDataset.stepTime.noTimeFieldsLabel', {
    defaultMessage: "The indices which match this index pattern don't contain any time fields.",
  });

  if (dateFields.length === 0) {
    return [
      {
        display: label,
      },
    ];
  }

  const disabledDividerOption = {
    isDisabled: true,
    display: '───',
    fieldName: '',
  };
  const noTimeFieldLabel = i18n.translate(
    'datasetManagement.createDataset.stepTime.noTimeFieldOptionLabel',
    {
      defaultMessage: "I don't want to use the time filter",
    }
  );
  const noTimeFieldOption = {
    display: noTimeFieldLabel,
    fieldName: undefined,
  };

  return [
    ...dateFields.map((field) => ({
      display: field.name,
      fieldName: field.name,
    })),
    disabledDividerOption,
    noTimeFieldOption,
  ];
}
