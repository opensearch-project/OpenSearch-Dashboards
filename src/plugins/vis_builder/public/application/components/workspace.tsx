/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiPanel } from '@elastic/eui';
import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IExpressionLoaderParams } from '../../../../expressions/public';
import { VisBuilderViewServices } from '../../types';
import { validateSchemaState, validateAggregations } from '../utils/validations';
import { useTypedDispatch, setUIStateState } from '../utils/state_management';
import { useAggs, useVisualizationType } from '../utils/use';
import { PersistedState } from '../../../../visualizations/public';
import { useVisBuilderContext } from '../view_components/context';

import hand_field from '../../assets/hand_field.svg';
import fields_bg from '../../assets/fields_bg.svg';

import './workspace.scss';
import { ExperimentalInfo } from './experimental_info';
import { handleVisEvent } from '../utils/handle_vis_event';

export const WorkspaceUI = () => {
  const { services } = useOpenSearchDashboards<VisBuilderViewServices>();
  const {
    expressions: { ReactExpressionRenderer },
    notifications: { toasts },
    data,
    uiActions,
  } = services;
  const { toExpression, ui } = useVisualizationType();
  const { aggConfigs } = useAggs();
  const [expression, setExpression] = useState<string>();
  const [searchContext, setSearchContext] = useState<IExpressionLoaderParams['searchContext']>({
    query: data.query.queryString.getQuery(),
    filters: data.query.filterManager.getFilters(),
    timeRange: data.query.timefilter.timefilter.getTime(),
  });
  const { indexPattern, rootState } = useVisBuilderContext();
  const dispatch = useTypedDispatch();
  // Visualizations require the uiState object to persist even when the expression changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const persistedUiState = useMemo(() => new PersistedState(rootState.ui), []);
  const indexId = rootState.metadata.indexPattern ? rootState.metadata.indexPattern : '';

  useEffect(() => {
    if (rootState.editor.status === 'loaded') {
      persistedUiState.setSilent(rootState.ui);
    }
    // To update uiState once saved object data is loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootState.editor.status, persistedUiState]);

  useEffect(() => {
    persistedUiState.on('change', (args) => {
      // Store changes to UI state
      dispatch(setUIStateState(persistedUiState.toJSON()));
    });
  }, [dispatch, persistedUiState]);

  useEffect(() => {
    async function loadExpression() {
      const schemas = ui.containerConfig.data.schemas;

      const noAggs = (aggConfigs?.aggs?.length ?? 0) === 0;
      const schemaValidation = validateSchemaState(schemas, rootState.visualization);
      const aggValidation = validateAggregations(aggConfigs?.aggs || []);

      if (!aggValidation.valid || !schemaValidation.valid) {
        setExpression(undefined);
        if (noAggs) return; // don't show error when there are no active aggregations

        const err = schemaValidation.errorMsg || aggValidation.errorMsg;

        if (err)
          toasts.addWarning({
            id: 'vb_expression_validation',
            title: err,
          });

        return;
      }
      const exp = await toExpression(rootState, indexId, searchContext);
      setExpression(exp);
    }

    loadExpression();
  }, [
    rootState,
    toExpression,
    toasts,
    ui.containerConfig.data.schemas,
    searchContext,
    aggConfigs,
    indexId,
  ]);

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
            uiState={persistedUiState}
            onEvent={(event) => handleVisEvent(event, uiActions, indexPattern?.timeFieldName)}
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

// The app uses EuiResizableContainer that triggers a rerender for every mouseover action.
// To prevent this child component from unnecessarily rerendering in that instance, it needs to be memoized
export const Workspace = React.memo(WorkspaceUI);
