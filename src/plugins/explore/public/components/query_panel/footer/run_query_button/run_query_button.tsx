/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButton } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { onEditorRunActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { selectIsLoading } from '../../../../application/utils/state_management/selectors';
import { useOnEditorRunContext } from '../../../../application/hooks';

export const RunQueryButton = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const onEditorRunContext = useOnEditorRunContext();
  const isLoading = useSelector(selectIsLoading);
  const dispatch = useDispatch();

  const handleClick = () => {
    dispatch(onEditorRunActionCreator(services, onEditorRunContext));
  };

  return (
    <EuiButton
      fill
      onClick={handleClick}
      data-test-subj="queryPanelFooterRunQueryButton"
      size="s"
      isLoading={isLoading}
    >
      {i18n.translate('explore.queryPanel.runQueryButton.label', {
        defaultMessage: 'Run query',
      })}
    </EuiButton>
  );
};
