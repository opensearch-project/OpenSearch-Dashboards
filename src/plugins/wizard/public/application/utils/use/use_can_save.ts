/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useTypedSelector } from '../state_management';

export const useCanSave = () => {
  const isEmpty = useTypedSelector(
    (state) => state.visualization.activeVisualization?.aggConfigParams?.length === 0
  );
  const hasNoChange = useTypedSelector((state) => state.metadata.editor.state !== 'dirty');
  const hasDraftAgg = useTypedSelector(
    (state) => !!state.visualization.activeVisualization?.draftAgg
  );
  const errorMsg = getErrorMsg(isEmpty, hasNoChange, hasDraftAgg);

  return errorMsg;
};

// TODO: Need to finalize the error messages
const getErrorMsg = (isEmpty, hasNoChange, hasDraftAgg) => {
  if (isEmpty) {
    return 'The canvas is empty. Add some aggregations before saving.';
  } else if (hasNoChange) {
    return 'Add some changes before saving.';
  } else if (hasDraftAgg) {
    return 'Has unapplied aggregations changes, update them before saving.';
  } else {
    return undefined;
  }
};
