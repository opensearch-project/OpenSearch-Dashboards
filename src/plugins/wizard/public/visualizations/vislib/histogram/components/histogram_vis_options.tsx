/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import produce, { Draft } from 'immer';
import { useTypedDispatch, useTypedSelector } from '../../../../application/utils/state_management';
import { HistogramOptionsDefaults } from '../histogram_vis_type';
import { BasicVisOptions } from '../../common/basic_vis_options';
import { setState } from '../../../../application/utils/state_management/style_slice';
import { Option } from '../../../../application/app';

function HistogramVisOptions() {
  const styleState = useTypedSelector((state) => state.style) as HistogramOptionsDefaults;
  const dispatch = useTypedDispatch();

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
        <BasicVisOptions styleState={styleState} setOption={setOption} />
      </Option>
    </>
  );
}

export { HistogramVisOptions };
