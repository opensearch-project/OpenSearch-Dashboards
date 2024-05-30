/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiPage, EuiPageBody } from '@elastic/eui';
import React, { useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { CreateDataSourcePanelHeader } from './create_data_source_panel_header';
import { CreateDataSourceCardView } from './create_data_source_card_view';

export const CreateDataSourcePanel: React.FC<RouteComponentProps> = (props) => {
  const { history } = props;

  useEffect(() => {
    history.push('/create');
  }, [history]);

  return (
    <EuiPage>
      <EuiPageBody component="div">
        <CreateDataSourcePanelHeader history={history} />
        <CreateDataSourceCardView />
      </EuiPageBody>
    </EuiPage>
  );
};
