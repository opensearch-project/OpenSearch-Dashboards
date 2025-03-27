/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './discover_visualization.scss';
import { i18n } from '@osd/i18n';

import { EuiButton, EuiPanel } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useDiscoverContext } from '../context';

import { SearchData } from '../utils';
import { IExpressionLoaderParams } from '../../../../../expressions/public';
import { useVisualizationType } from '../utils/use_visualization_types';
import { showSaveModal } from '../../../../../saved_objects/public';
import { OnSaveProps, SavedObjectSaveModal } from './discover_visualization_save_modal';

export const DiscoverVisualization = ({ hits, bucketInterval, chartData, rows }: SearchData) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    data: {
      query: { filterManager, queryString, timefilter },
    },
    expressions: { ReactExpressionRenderer },
    toastNotifications,
  } = services;
  const { indexPattern, savedMetric, savedSearch } = useDiscoverContext();

  // Get configs and expression utils from a specific visualization type
  const { toExpression } = useVisualizationType();
  //   const { aggConfigs, indexPattern } = useAggs();
  const [expression, setExpression] = useState<string>();
  const [searchContext, setSearchContext] = useState<IExpressionLoaderParams['searchContext']>({
    query: queryString.getQuery(),
    filters: filterManager.getFilters(),
    timeRange: timefilter.timefilter.getTime(),
  });
  const [enableViz, setEnableViz] = useState(
    queryString.getLanguageService().getLanguage(queryString.getQuery()!.language)!
      .showVisualization
  );

  useEffect(() => {
    async function loadExpression() {
      if (!rows || !indexPattern) {
        return;
      }
      const exp = await toExpression(services, searchContext, rows, indexPattern);
      setExpression(exp);
    }

    loadExpression();
  }, [toExpression, searchContext, rows, indexPattern, services]);

  useEffect(() => {
    const subscription = services.data.query.state$.subscribe(({ state }) => {
      setSearchContext({
        query: state.query,
        timeRange: state.time,
        filters: state.filters,
      });
      setEnableViz(
        queryString.getLanguageService().getLanguage(state.query!.language)!.showVisualization ??
          false
      );
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryString, services.data.query.state$]);

  const saveAction = () => {
    const onSave = async ({
      title,
      selectedOption,
      newDashboardTitle,
      existingDashboardTitle,
    }: OnSaveProps) => {
      try {
        if (!savedMetric) {
          return;
        }
        savedMetric.title = title;
        savedMetric.expression = expression!;
        const id = await savedMetric!.save({});

        if (id) {
          toastNotifications.addSuccess({
            title: i18n.translate('discover.notifications.savedMetricTitle', {
              defaultMessage: `Metric '{title}' was saved`,
              values: {
                title,
              },
            }),
            'data-test-subj': 'saveSearchSuccess',
          });
          return { id };
        }
      } catch (error) {
        toastNotifications.addDanger({
          title: i18n.translate('discover.notifications.savedMetricErrorTitle', {
            defaultMessage: `Error saving metric`,
          }),
          text: error.message,
          'data-test-subj': 'saveMetricError',
        });
        return { error };
      }
    };
    const saveModal = (
      <SavedObjectSaveModal
        onSave={onSave}
        onClose={() => {}}
        description={'Save your metric visual'}
        dashboards={[
          { id: 'dashboard1', title: 'Dashboard 1' },
          { id: 'dashboard2', title: 'Dashboard 2' },
        ]}
      />
    );
    showSaveModal(saveModal, services.i18n.Context);
  };

  return enableViz && expression ? (
    <EuiPanel className="discoverVisualization" data-test-subj="visualizationLoader">
      <div style={{ position: 'relative', width: '100%', height: '100%', flex: '1 1 auto' }}>
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 100 }}>
          <EuiButton size="s" onClick={saveAction}>
            Save Visual
          </EuiButton>
        </div>

        <div style={{ width: '100%', height: '100%', paddingTop: '40px' }}>
          <ReactExpressionRenderer
            key={JSON.stringify(searchContext) + expression}
            expression={expression}
            searchContext={searchContext}
          />
        </div>
      </div>
    </EuiPanel>
  ) : (
    <></>
  );
};
