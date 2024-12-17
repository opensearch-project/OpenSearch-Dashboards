/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SavedQueryAttributes, SavedQueryService } from '../../query';
import { SaveQueryForm, SavedQueryMeta } from '../saved_query_form';

interface SaveQueryFlyoutProps {
  savedQuery?: SavedQueryAttributes;
  savedQueryService: SavedQueryService;
  onSave: (savedQueryMeta: SavedQueryMeta, saveAsNew?: boolean) => Promise<void>;
  onClose: () => void;
  showFilterOption: boolean | undefined;
  showTimeFilterOption: boolean | undefined;
}

export function SaveQueryFlyout({
  savedQuery,
  savedQueryService,
  onSave,
  onClose,
  showFilterOption,
  showTimeFilterOption,
}: SaveQueryFlyoutProps) {
  const [saveAsNew, setSaveAsNew] = useState(!savedQuery || savedQuery.isTemplate);

  return (
    <SaveQueryForm
      formUiType="Flyout"
      onClose={onClose}
      onSave={async (savedQueryMeta) => {
        try {
          await onSave(savedQueryMeta, saveAsNew);
          onClose();
        } catch (error) {
          // error toast is already shown inside the onSave above,
          // catching error to avoid UI crash
          // adding comment to prevent no-empty lint error
        }
      }}
      savedQueryService={savedQueryService}
      showFilterOption={showFilterOption}
      showTimeFilterOption={showTimeFilterOption}
      setSaveAsNew={(shouldSaveAsNew) => setSaveAsNew(shouldSaveAsNew)}
      savedQuery={saveAsNew ? undefined : savedQuery}
      saveAsNew={saveAsNew}
      cannotBeOverwritten={!!savedQuery?.isTemplate}
    />
  );
}
