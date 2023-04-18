/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiPanel } from '@elastic/eui';
import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IExpressionLoaderParams } from '../../../../expressions/public';
import { VisBuilderServices } from '../../types';
import { validateSchemaState, validateAggregations } from '../utils/validations';
import { useTypedDispatch, useTypedSelector, setUIStateState } from '../utils/state_management';
import { useAggs, useVisualizationType } from '../utils/use';
import { PersistedState } from '../../../../visualizations/public';

import hand_field from '../../assets/hand_field.svg';
import fields_bg from '../../assets/fields_bg.svg';

import './workspace.scss';
import { ExperimentalInfo } from './experimental_info';
import { handleVisEvent } from '../utils/handle_vis_event';

export const WorkspaceUI = () => {
  const {
    services: {
      expressions: { ReactExpressionRenderer },
      notifications: { toasts },
      data,
      uiActions,
    },
  } = useOpenSearchDashboards<VisBuilderServices>();
  const { toExpression, ui } = useVisualizationType();
  const { aggConfigs, indexPattern } = useAggs();
  const [expression, setExpression] = useState<string>();
  const [searchContext, setSearchContext] = useState<IExpressionLoaderParams['searchContext']>({
    query: data.query.queryString.getQuery(),
    filters: data.query.filterManager.getFilters(),
    timeRange: data.query.timefilter.timefilter.getTime(),
  });
  const rootState = useTypedSelector((state) => state);
  const dispatch = useTypedDispatch();
  // Visualizations require the uiState object to persist even when the expression changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const uiState = useMemo(() => new PersistedState(rootState.ui), []);

  useEffect(() => {
    if (rootState.metadata.editor.state === 'loaded') {
      uiState.setSilent(rootState.ui);
    }
    // To update uiState once saved object data is loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootState.metadata.editor.state, uiState]);

  useEffect(() => {
    uiState.on('change', (args) => {
      // Store changes to UI state
      dispatch(setUIStateState(uiState.toJSON()));
    });
  }, [dispatch, uiState]);

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
