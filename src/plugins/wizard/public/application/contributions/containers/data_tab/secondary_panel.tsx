/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import { cloneDeep } from 'lodash';
import { useTypedDispatch, useTypedSelector } from '../../../utils/state_management';
import { DefaultEditorAggParams } from '../../../../../../vis_default_editor/public';
import { Title } from './items';
import { useIndexPattern, useVisualizationType } from '../../../utils/use';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { WizardServices } from '../../../../types';
import { IAggType } from '../../../../../../data/public';
import { saveAgg, editAgg } from '../../../utils/state_management/visualization_slice';

export function SecondaryPanel() {
  const draftAgg = useTypedSelector((state) => state.visualization.activeVisualization!.draftAgg);
  const [valid, setValid] = useState(true);
  const [touched, setTouched] = useState(false);
  const dispatch = useTypedDispatch();
  const vizType = useVisualizationType();
  const indexPattern = useIndexPattern();
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

  const groupName = useMemo(
    () => schemas.find((schema) => schema.name === aggConfig?.schema)?.group,
    [aggConfig?.schema, schemas]
  );

  const showAggParamEditor = !!(aggConfig && indexPattern);

  const closeMenu = useCallback(() => {
    // Save the agg if valid else discard
    dispatch(saveAgg(valid));
  }, [dispatch, valid]);

  return (
    <div className="wizConfig__section wizConfig--secondary">
      <Title title="Test" isSecondary closeMenu={closeMenu} />
      {showAggParamEditor && (
        <DefaultEditorAggParams
          className="wizConfig__aggEditor"
          agg={aggConfig!}
          indexPattern={indexPattern!}
          setValidity={setValid}
          setTouched={setTouched}
          schemas={schemas}
          formIsTouched={false}
          groupName={groupName ?? 'none'}
          metricAggs={[]}
          state={{
            data: {},
            description: 'Falalala',
            title: 'Title for the aggParams',
          }}
          setAggParamValue={function <T extends string | number | symbol>(
            aggId: string,
            paramName: T,
            value: any
          ): void {
            aggConfig.params[paramName] = value;
            dispatch(editAgg(aggConfig.serialize()));
          }}
          onAggTypeChange={function (aggId: string, aggType: IAggType): void {
            aggConfig.type = aggType;
            dispatch(editAgg(aggConfig.serialize()));
          }}
        />
      )}
    </div>
  );
}
