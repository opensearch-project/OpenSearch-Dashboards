/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import produce, { Draft } from 'immer';
import { useTypedDispatch, setStyleState } from '../../../../application/utils/state_management';
import { HistogramOptionsDefaults } from '../histogram_vis_type';
import { BasicVisOptions } from '../../common/basic_vis_options';
import { Option } from '../../../../application/components/option';
import { useVisBuilderContext } from '../../../../application/view_components/context';

function HistogramVisOptions() {
  const { rootState } = useVisBuilderContext();
  const styleState = rootState.style as HistogramOptionsDefaults;
  const dispatch = useTypedDispatch();

  const setOption = useCallback(
    (callback: (draft: Draft<typeof styleState>) => void) => {
      const newState = produce(styleState, callback);
      dispatch(setStyleState<HistogramOptionsDefaults>(newState));
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
        <BasicVisOptions styleState={styleState} setOption={setOption} />
      </Option>
    </>
  );
}

export { HistogramVisOptions };
