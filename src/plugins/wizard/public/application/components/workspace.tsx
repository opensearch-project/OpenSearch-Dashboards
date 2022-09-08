/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiPanel } from '@elastic/eui';
import React, { FC, useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IExpressionLoaderParams } from '../../../../expressions/public';
import { WizardServices } from '../../types';
import { validateSchemaState } from '../utils/validate_schema_state';
import { useTypedSelector } from '../utils/state_management';
import { useVisualizationType } from '../utils/use';
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
  } = useOpenSearchDashboards<WizardServices>();
  const { toExpression, ui } = useVisualizationType();
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
      const [valid, errorMsg] = validateSchemaState(schemas, rootState);

      if (!valid) {
        if (errorMsg) {
          toasts.addWarning(errorMsg);
        }
        setExpression(undefined);
        return;
      }
      const exp = await toExpression(rootState);
      setExpression(exp);
    }

    loadExpression();
  }, [rootState, toExpression, toasts, ui.containerConfig.data.schemas]);

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
    <section className="wizWorkspace">
      <EuiFlexGroup className="wizCanvasControls">
        <EuiFlexItem>
          <ExperimentalInfo />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiPanel className="wizCanvas" data-test-subj="visualizationLoader">
        {expression ? (
          <ReactExpressionRenderer
            expression={expression}
            searchContext={searchContext}
            uiState={uiState}
          />
        ) : (
          <EuiFlexItem className="wizWorkspace__empty" data-test-subj="emptyWorkspace">
            <EuiEmptyPrompt
              title={<h2>Add a field to start</h2>}
              body={
                <>
                  <p>Drag a field to the configuration panel to generate a visualization.</p>
                  <span className="wizWorkspace__container">
                    <EuiIcon className="wizWorkspace__fieldSvg" type={fields_bg} size="original" />
                    <EuiIcon
                      className="wizWorkspace__handFieldSvg"
                      type={hand_field}
                      size="original"
                    />
                  </span>
                </>
              }
            />
          </EuiFlexItem>
        )}
      </EuiPanel>
    </section>
  );
};
