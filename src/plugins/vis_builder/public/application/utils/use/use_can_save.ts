/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { useTypedSelector } from '../state_management';

export const useCanSave = () => {
  const isEmpty = useTypedSelector(
    (state) => state.visualization.activeVisualization?.aggConfigParams?.length === 0
  );
  const hasNoChange = useTypedSelector((state) => {
    return state.metadata.editor.state !== 'dirty' && state.metadata.isMigrated === false;
  });
  const hasDraftAgg = useTypedSelector(
    (state) => !!state.visualization.activeVisualization?.draftAgg
  );
  const errorMsg = getErrorMsg(isEmpty, hasNoChange, hasDraftAgg);

  return errorMsg;
};

// TODO: Need to finalize the error messages
const getErrorMsg = (isEmpty, hasNoChange, hasDraftAgg) => {
  if (isEmpty) {
    return i18n.translate('visBuilder.saveVisualizationTooltip.empty', {
      defaultMessage: 'The canvas is empty. Add some aggregations before saving.',
    });
  } else if (hasNoChange) {
    return i18n.translate('visBuilder.saveVisualizationTooltip.noChange', {
      defaultMessage: 'Add some changes before saving.',
    });
  } else if (hasDraftAgg) {
    return i18n.translate('visBuilder.saveVisualizationTooltip.hasDraftAgg', {
      defaultMessage: 'Update unapplied aggregation changes before saving.',
    });
  } else {
    return undefined;
  }
};
