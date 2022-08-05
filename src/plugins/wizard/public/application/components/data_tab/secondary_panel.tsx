/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import { cloneDeep } from 'lodash';
import { useDebounce } from 'react-use';
import { useTypedDispatch, useTypedSelector } from '../../utils/state_management';
import { DefaultEditorAggParams } from '../../../../../vis_default_editor/public';
import { Title } from './title';
import { useIndexPatterns, useVisualizationType } from '../../utils/use';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { WizardServices } from '../../../types';
import { IAggType } from '../../../../../data/public';
import { saveDraftAgg, editDraftAgg } from '../../utils/state_management/visualization_slice';
import { setValidity } from '../../utils/state_management/metadata_slice';

const EDITOR_KEY = 'CONFIG_PANEL';

export function SecondaryPanel() {
  const draftAgg = useTypedSelector((state) => state.visualization.activeVisualization!.draftAgg);
  const isEditorValid = useTypedSelector(
    (state) => state.metadata.editorState.validity[EDITOR_KEY]
  );
  const [touched, setTouched] = useState(false);
  const dispatch = useTypedDispatch();
  const vizType = useVisualizationType();
  const indexPattern = useIndexPatterns().selected;
  const {
    services: {
      data: {
        search: { aggs: aggService },
      },
    },
  } = useOpenSearchDashboards<WizardServices>();
  const schemas = vizType.ui.containerConfig.data.schemas.all;

  const aggConfigs = useMemo(() => {
    return (
      indexPattern && draftAgg && aggService.createAggConfigs(indexPattern, [cloneDeep(draftAgg)])
    );
  }, [draftAgg, aggService, indexPattern]);

  const aggConfig = aggConfigs?.aggs[0];

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
        setValidity({
          key: EDITOR_KEY,
          valid: isValid,
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
    <div className="wizConfig__section wizConfig--secondary">
      <Title title={selectedSchema?.title ?? 'Edit'} isSecondary closeMenu={closeMenu} />
      {showAggParamEditor && (
        <DefaultEditorAggParams
          className="wizConfig__aggEditor"
          agg={aggConfig!}
          indexPattern={indexPattern!}
          setValidity={handleSetValid}
          setTouched={setTouched}
          schemas={schemas}
          formIsTouched={touched}
          groupName={selectedSchema?.group ?? 'none'}
          metricAggs={[]}
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
            dispatch(editDraftAgg(aggConfig.serialize()));
          }}
        />
      )}
    </div>
  );
}
