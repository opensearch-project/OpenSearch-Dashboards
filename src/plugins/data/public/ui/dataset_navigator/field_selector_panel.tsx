/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { EuiSelectable, EuiContextMenuPanel, EuiComboBox, EuiSelect } from '@elastic/eui';
import { IFieldType, IndexPatternsContract } from '../..';
import { i18n } from '@osd/i18n';

export function extractTimeFields(fields: IFieldType[]) {
  const dateFields = fields.filter((field) => field.type === 'date');
  const label = i18n.translate(
    'indexPatternManagement.createIndexPattern.stepTime.noTimeFieldsLabel',
    {
      defaultMessage: "The indices which match this index pattern don't contain any time fields.",
    }
  );

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
    'indexPatternManagement.createIndexPattern.stepTime.noTimeFieldOptionLabel',
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


export const FieldSelctorPanel = ({
  index,
  dataSourceId,
  indexPatterns,
}: {
  index: string;
  dataSourceId: string;
  indexPatterns: IndexPatternsContract;
}) => {
  const [timeStampFields, setTimeStampFields] = useState<any[]>([]);

  const getTimeStampFields = async () => {
    const fields = await indexPatterns.getFieldsForWildcard({ pattern: index, dataSourceId});
    const timeFields = extractTimeFields(fields);
    setTimeStampFields(timeFields);
  };

  const dropdown = <EuiSelect options={[]} />;

  return {
    id: 3,
    title: index,
    content: <div />,
  };
};
