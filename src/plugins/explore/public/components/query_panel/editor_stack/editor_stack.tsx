/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { EuiProgress } from '@elastic/eui';
import {
  selectIsLoading,
  selectPromptToQueryIsLoading,
} from '../../../application/utils/state_management/selectors';
import { TopEditor } from './top_editor';
import { BottomEditor } from './bottom_editor';

export const EditorStack = () => {
  const queryIsLoading = useSelector(selectIsLoading);
  const promptToQueryIsLoading = useSelector(selectPromptToQueryIsLoading);
  const isLoading = queryIsLoading || promptToQueryIsLoading;

  return (
    <div>
      <TopEditor />
      <BottomEditor />
      {isLoading && (
        <EuiProgress
          size="xs"
          color="accent"
          position="absolute"
          data-test-subj="exploreQueryPanelIsLoading"
        />
      )}
    </div>
  );
};
