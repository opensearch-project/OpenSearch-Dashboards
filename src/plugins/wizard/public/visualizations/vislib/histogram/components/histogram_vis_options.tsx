/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import produce, { Draft } from 'immer';
import { SelectOption, SwitchOption } from '../../../../../../charts/public';
import { useTypedDispatch, useTypedSelector } from '../../../../application/utils/state_management';
import { HistogramOptionsDefaults } from '../histogram_vis_type';
import { setState } from '../../../../application/utils/state_management/style_slice';
import { Option } from '../../../../application/app';
import { getConfigCollections } from '../../../../../../vis_type_vislib/public';

function HistogramVisOptions() {
  const styleState = useTypedSelector((state) => state.style) as HistogramOptionsDefaults;
  const dispatch = useTypedDispatch();
  const { legendPositions } = getConfigCollections();

  const setOption = useCallback(
    (callback: (draft: Draft<typeof styleState>) => void) => {
      const newState = produce(styleState, callback);
      dispatch(setState<HistogramOptionsDefaults>(newState));
    },
    [dispatch, styleState]
  );

  return (
    <>
      <Option
        title={i18n.translate('visTypeVislib.histogram.params.settingsTitle', {
          defaultMessage: 'Settings',
        })}
        initialIsOpen
      >
        <SelectOption
          label={i18n.translate('charts.controls.vislibBasicOptions.legendPositionLabel', {
            defaultMessage: 'Legend position',
          })}
          options={legendPositions}
          paramName="legendPosition"
          value={styleState.legendPosition}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.legendPosition = value;
            })
          }
        />
        <SwitchOption
          label={i18n.translate('charts.controls.vislibBasicOptions.showTooltipLabel', {
            defaultMessage: 'Show tooltip',
          })}
          paramName="addTooltip"
          value={styleState.addTooltip}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.addTooltip = value;
            })
          }
        />
      </Option>
    </>
  );
}

export { HistogramVisOptions };
