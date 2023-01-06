/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiPanel } from '@elastic/eui';
import React, { FC, useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IExpressionLoaderParams } from '../../../../expressions/public';
import { VisBuilderServices } from '../../types';
import { validateSchemaState, validateAggregations } from '../utils/validations';
import { useTypedSelector } from '../utils/state_management';
import { useAggs, useVisualizationType } from '../utils/use';
import { PersistedState } from '../../../../visualizations/public';

import hand_field from '../../assets/hand_field.svg';
import fields_bg from '../../assets/fields_bg.svg';

import './workspace.scss';
import { ExperimentalInfo } from './experimental_info';

export const Workspace: FC = ({ children }) => {
  const {
    services: {
      expressions: { ReactExpressionRenderer },
      notifications: { toasts },
      data,
    },
  } = useOpenSearchDashboards<VisBuilderServices>();
  const { toExpression, ui } = useVisualizationType();
  const { aggConfigs } = useAggs();
  const [expression, setExpression] = useState<string>();
  const [searchContext, setSearchContext] = useState<IExpressionLoaderParams['searchContext']>({
    query: data.query.queryString.getQuery(),
    filters: data.query.filterManager.getFilters(),
    timeRange: data.query.timefilter.timefilter.getTime(),
  });
  const rootState = useTypedSelector((state) => state);
  // Visualizations require the uiState to persist even when the expression changes
  const uiState = useMemo(() => new PersistedState(), []);

  useEffect(() => {
    async function loadExpression() {
      const schemas = ui.containerConfig.data.schemas;

      const noAggs = aggConfigs?.aggs?.length === 0;
      const schemaValidation = validateSchemaState(schemas, rootState.visualization);
      const aggValidation = validateAggregations(aggConfigs?.aggs || []);

      if (noAggs || !aggValidation.valid || !schemaValidation.valid) {
        const err = schemaValidation.errorMsg || aggValidation.errorMsg;

        if (err) toasts.addWarning(err);
        setExpression(undefined);

        return;
      }

      const exp = await toExpression(rootState, searchContext);
      setExpression(exp);
    }

    loadExpression();
  }, [rootState, toExpression, toasts, ui.containerConfig.data.schemas, searchContext, aggConfigs]);

  useLayoutEffect(() => {
    const subscription = data.query.state$.subscribe(({ state }) => {
      setSearchContext({
        query: state.query,
        timeRange: state.time,
        filters: state.filters,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [data.query.state$]);

  return (
    <section className="vbWorkspace">
      <EuiFlexGroup className="vbCanvasControls">
        <EuiFlexItem>
          <ExperimentalInfo />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiPanel className="vbCanvas" data-test-subj="visualizationLoader">
        {expression ? (
          <ReactExpressionRenderer
            expression={expression}
            searchContext={searchContext}
            uiState={uiState}
          />
        ) : (
          <EuiFlexItem className="vbWorkspace__empty" data-test-subj="emptyWorkspace">
            <EuiEmptyPrompt
              title={
                <h2>
                  {i18n.translate('visBuilder.workSpace.empty.title', {
                    defaultMessage: 'Add a field to start',
                  })}
                </h2>
              }
              body={
                <>
                  <p>
                    {i18n.translate('visBuilder.workSpace.empty.description', {
                      defaultMessage:
                        'Drag a field to the configuration panel to generate a visualization.',
                    })}
                  </p>
                  <div className="vbWorkspace__container">
                    <EuiIcon className="vbWorkspace__fieldSvg" type={fields_bg} size="original" />
                    <EuiIcon
                      className="vbWorkspace__handFieldSvg"
                      type={hand_field}
                      size="original"
                    />
                  </div>
                </>
              }
            />
          </EuiFlexItem>
        )}
      </EuiPanel>
    </section>
  );
};
