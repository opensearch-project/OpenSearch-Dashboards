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
  const hasNoChange = useTypedSelector((state) => state.metadata.editor.state !== 'dirty');
  const hasDraftAgg = useTypedSelector(
    (state) => !!state.visualization.activeVisualization?.draftAgg
  );
  const errorMsg = getErrorMsg(isEmpty, hasNoChange, hasDraftAgg);

  return errorMsg;
};

// TODO: Need to finalize the error messages
const getErrorMsg = (isEmpty, hasNoChange, hasDraftAgg) => {
  const i18nTranslate = (key: string, defaultMessage: string) =>
    i18n.translate(`wizard.saveVisualizationTooltip.${key}`, {
      defaultMessage,
    });

  if (isEmpty) {
    return i18nTranslate('empty', 'The canvas is empty. Add some aggregations before saving.');
  } else if (hasNoChange) {
    return i18nTranslate('noChange', 'Add some changes before saving.');
  } else if (hasDraftAgg) {
    return i18nTranslate(
      'hasDraftAgg',
      'Has unapplied aggregations changes, update them before saving.'
    );
  } else {
    return undefined;
  }
};
