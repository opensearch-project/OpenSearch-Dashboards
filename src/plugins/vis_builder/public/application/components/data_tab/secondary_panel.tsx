/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, useCallback, useMemo, useState } from 'react';
import { cloneDeep, get } from 'lodash';
import { useDebounce } from 'react-use';
import { i18n } from '@osd/i18n';
import { EuiCallOut } from '@elastic/eui';
import { useTypedDispatch, useTypedSelector } from '../../utils/state_management';
import { DefaultEditorAggParams } from '../../../../../vis_default_editor/public';
import { Title } from './title';
import { useIndexPatterns, useVisualizationType } from '../../utils/use';
import {
  OpenSearchDashboardsContextProvider,
  useOpenSearchDashboards,
} from '../../../../../opensearch_dashboards_react/public';
import { VisBuilderServices } from '../../../types';
import { AggParam, IAggType, IFieldParamType } from '../../../../../data/public';
import { saveDraftAgg, editDraftAgg } from '../../utils/state_management/visualization_slice';
import { setError } from '../../utils/state_management/metadata_slice';
import { Storage } from '../../../../../opensearch_dashboards_utils/public';

const PANEL_KEY = 'SECONDARY_PANEL';

export function SecondaryPanel() {
  const { draftAgg, aggConfigParams } = useTypedSelector(
    (state) => state.visualization.activeVisualization!
  );
  const isEditorValid = useTypedSelector((state) => !state.metadata.editor.errors[PANEL_KEY]);
  const [touched, setTouched] = useState(false);
  const dispatch = useTypedDispatch();
  const vizType = useVisualizationType();
  const indexPattern = useIndexPatterns().selected;
  const { services } = useOpenSearchDashboards<VisBuilderServices>();
  const {
    data: {
      search: { aggs: aggService },
    },
  } = services;
  const schemas = vizType.ui.containerConfig.data.schemas.all;

  const aggConfigs = useMemo(() => {
    return (
      indexPattern && draftAgg && aggService.createAggConfigs(indexPattern, [cloneDeep(draftAgg)])
    );
  }, [draftAgg, aggService, indexPattern]);
  const aggConfig = aggConfigs?.aggs[0];

  const metricAggs = useMemo(
    () =>
      indexPattern
        ? aggService.createAggConfigs(
            indexPattern,
            cloneDeep(
              aggConfigParams.filter((aggConfigParam) => aggConfigParam.schema === 'metric')
            )
          ).aggs
        : [],
    [aggConfigParams, aggService, indexPattern]
  );

  const selectedSchema = useMemo(
    () => schemas.find((schema) => schema.name === aggConfig?.schema),
    [aggConfig?.schema, schemas]
  );

  const showAggParamEditor = !!(aggConfig && indexPattern);

  const closeMenu = useCallback(() => {
    dispatch(editDraftAgg(undefined));
  }, [dispatch]);

  const handleSetValid = useCallback(
    (isValid: boolean) => {
      // Set validity state globally
      dispatch(
        setError({
          key: PANEL_KEY,
          error: !isValid,
        })
      );
    },
    [dispatch]
  );

  // Autosave is agg value has changed and edits are valid
  useDebounce(
    () => {
      if (isEditorValid) {
        dispatch(saveDraftAgg());
      } else {
        // To indicate that an invalid edit was made
        setTouched(true);
      }
    },
    200,
    [draftAgg, isEditorValid]
  );

  return (
    <div className="vbConfig__section vbConfig--secondary">
      <Title title={selectedSchema?.title ?? 'Edit'} isSecondary closeMenu={closeMenu} />
      {showAggParamEditor && (
        <OpenSearchDashboardsContextProvider
          services={{
            ...services,
            storage: new Storage(window.localStorage), // This is necessary for filters
          }}
        >
          <EditorErrorBoundary>
            <DefaultEditorAggParams
              className="vbConfig__aggEditor"
              agg={aggConfig!}
              indexPattern={indexPattern!}
              setValidity={handleSetValid}
              setTouched={setTouched}
              schemas={schemas}
              formIsTouched={touched}
              groupName={selectedSchema?.group ?? 'none'}
              metricAggs={metricAggs}
              state={{
                data: {},
                description: '',
                title: '',
              }}
              setAggParamValue={function <T extends string | number | symbol>(
                aggId: string,
                paramName: T,
                value: any
              ): void {
                aggConfig.params[paramName] = value;
                dispatch(editDraftAgg(aggConfig.serialize()));
              }}
              onAggTypeChange={function (aggId: string, aggType: IAggType): void {
                aggConfig.type = aggType;

                // Persist field if the new agg type supports the existing field
                const fieldParam = (aggType.params as AggParam[]).find(
                  ({ type }) => type === 'field'
                );
                if (fieldParam) {
                  const availableFields = (fieldParam as IFieldParamType).getAvailableFields(
                    aggConfig
                  );
                  const indexField = availableFields.find(
                    ({ name }) => name === get(draftAgg, 'params.field')
                  );

                  if (indexField) {
                    aggConfig.params.field = indexField;
                  }
                }

                dispatch(editDraftAgg(aggConfig.serialize()));
              }}
            />
          </EditorErrorBoundary>
        </OpenSearchDashboardsContextProvider>
      )}
    </div>
  );
}

class EditorErrorBoundary extends Component<{}, { error?: any }> {
  state = {
    error: undefined,
  };

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <EuiCallOut
          title={i18n.translate('visBuilder.aggParamsEditor.errorTitle', {
            defaultMessage: 'Error',
          })}
          color="danger"
          iconType="alert"
        >
          <p>
            {i18n.translate('visBuilder.aggParamsEditor.errorMsg', {
              defaultMessage: 'Something went wrong while editing the aggregation',
            })}
          </p>
        </EuiCallOut>
      );
    }
    return this.props.children;
  }
}
