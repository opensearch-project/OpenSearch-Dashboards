/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';

import { EuiFormLabel, EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';

import { DataTab } from './data_tab';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WizardServices } from '../../types';
import { StyleTab } from './style_tab';

import './side_nav.scss';
import { useTypedDispatch, useTypedSelector } from '../utils/state_management';
import { setIndexPattern } from '../utils/state_management/datasource_slice';

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

  const tabs: EuiTabbedContentTab[] = [
    {
      id: 'data-tab',
      name: i18n.translate('wizard.nav.dataTab.title', {
        defaultMessage: 'Data',
      }),
      content: <DataTab />,
    },
    {
      id: 'style-tab',
      name: i18n.translate('wizard.nav.styleTab.title', {
        defaultMessage: 'Style',
      }),
      content: <StyleTab />,
    },
  ];

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
