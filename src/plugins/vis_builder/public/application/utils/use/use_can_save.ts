/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { useVisBuilderContext } from '../../view_components/context';

export const useCanSave = () => {
  const { rootState } = useVisBuilderContext();
  const isEmpty = rootState.visualization.activeVisualization?.aggConfigParams?.length === 0;
  const hasDraftAgg = !!rootState.visualization.activeVisualization?.draftAgg;
  const errorMsg = getErrorMsg(isEmpty, hasDraftAgg);

  return errorMsg;
};

// TODO: Need to finalize the error messages
const getErrorMsg = (isEmpty, hasDraftAgg) => {
  const i18nTranslate = (key: string, defaultMessage: string) =>
    i18n.translate(`visBuilder.saveVisualizationTooltip.${key}`, {
      defaultMessage,
    });

  if (isEmpty) {
    return i18nTranslate('empty', 'The canvas is empty. Add some aggregations before saving.');
  } else if (hasDraftAgg) {
    return i18nTranslate(
      'hasDraftAgg',
      'Has unapplied aggregations changes, update them before saving.'
    );
  } else {
    return undefined;
  }
};
