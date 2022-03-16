/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFormLabel, EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WizardServices } from '../../types';
import './side_nav.scss';
import { useTypedDispatch, useTypedSelector } from '../utils/state_management';
import { setIndexPattern } from '../utils/state_management/datasource_slice';
import { useVisualizationType } from '../utils/use';

export const SideNav = () => {
  const {
    services: {
      data,
      savedObjects: { client: savedObjectsClient },
    },
  } = useOpenSearchDashboards<WizardServices>();
  const { IndexPatternSelect } = data.ui;
  const { indexPattern } = useTypedSelector((state) => state.dataSource);
  const dispatch = useTypedDispatch();
  const {
    contributions: { containers },
  } = useVisualizationType();

  const tabs: EuiTabbedContentTab[] = containers.sidePanel.map(({ id, name, Component }) => ({
    id,
    name,
    content: Component,
  }));

  return (
    <section className="wizSidenav">
      <div className="wizDatasourceSelector">
        <EuiFormLabel>
          {i18n.translate('wizard.nav.dataSource.selector.title', {
            defaultMessage: 'Index Pattern',
          })}
        </EuiFormLabel>
        <IndexPatternSelect
          savedObjectsClient={savedObjectsClient}
          placeholder={i18n.translate('wizard.nav.dataSource.selector.placeholder', {
            defaultMessage: 'Select index pattern',
          })}
          indexPatternId={indexPattern?.id || ''}
          onChange={async (newIndexPatternId: any) => {
            const newIndexPattern = await data.indexPatterns.get(newIndexPatternId);
            dispatch(setIndexPattern(newIndexPattern));
          }}
          isClearable={false}
        />
      </div>
      <EuiTabbedContent tabs={tabs} className="wizSidenavTabs" />
    </section>
  );
};
