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
import { setIndexPattern } from '../utils/state_management/visualization_slice';
import { useVisualizationType } from '../utils/use';
import { DataTab } from '../contributions';
import { StyleTabConfig } from '../../services/type_service';

export const SideNav = () => {
  const {
    services: {
      data,
      savedObjects: { client: savedObjectsClient },
    },
  } = useOpenSearchDashboards<WizardServices>();
  const { IndexPatternSelect } = data.ui;
  const { indexPattern: indexPatternId } = useTypedSelector((state) => state.visualization);
  const dispatch = useTypedDispatch();
  const {
    ui: { containerConfig },
  } = useVisualizationType();

  const tabs: EuiTabbedContentTab[] = Object.entries(containerConfig).map(
    ([containerName, config]) => {
      let content = null;
      switch (containerName) {
        case 'data':
          content = <DataTab key="containerName" />;
          break;

        case 'style':
          content = (config as StyleTabConfig).render();
          break;
      }

      return {
        id: containerName,
        name: containerName,
        content,
      };
    }
  );

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
          indexPatternId={indexPatternId || ''}
          onChange={async (newIndexPatternId: any) => {
            const newIndexPattern = await data.indexPatterns.get(newIndexPatternId);

            if (newIndexPattern) {
              dispatch(setIndexPattern(newIndexPatternId));
            }
          }}
          isClearable={false}
        />
      </div>
      <EuiTabbedContent tabs={tabs} className="wizSidenavTabs" />
    </section>
  );
};
