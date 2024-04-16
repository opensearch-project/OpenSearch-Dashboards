/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCheckbox } from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { capitalizeFirstLetter } from './utils';

// A checkbox showing the type and count of save objects.
function renderDuplicateObjectCategory(
  savedObjectType: string,
  savedObjectTypeCount: number,
  savedObjectTypeChecked: boolean,
  changeIncludeSavedObjectType: (savedObjectType: string) => void
) {
  return (
    <EuiCheckbox
      id={'includeSavedObjectType.' + savedObjectType}
      key={savedObjectType}
      label={
        <FormattedMessage
          id={
            'savedObjectsManagement.objectsTable.duplicateModal.savedObjectType.' + savedObjectType
          }
          defaultMessage={
            capitalizeFirstLetter(savedObjectType) + ` (${savedObjectTypeCount.toString()})`
          }
        />
      }
      checked={savedObjectTypeChecked}
      onChange={() => changeIncludeSavedObjectType(savedObjectType)}
    />
  );
}

// eslint-disable-next-line import/no-default-export
export default function RenderDuplicateObjectCategories(
  savedObjectTypeInfoMap: Map<string, [number, boolean]>,
  changeIncludeSavedObjectType: (savedObjectType: string) => void
) {
  const checkboxList: React.JSX.Element[] = [];
  savedObjectTypeInfoMap.forEach(
    ([savedObjectTypeCount, savedObjectTypeChecked], savedObjectType) =>
      checkboxList.push(
        renderDuplicateObjectCategory(
          savedObjectType,
          savedObjectTypeCount,
          savedObjectTypeChecked,
          changeIncludeSavedObjectType
        )
      )
  );
  return checkboxList;
}
