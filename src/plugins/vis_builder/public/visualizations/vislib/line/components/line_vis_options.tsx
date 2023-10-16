/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import produce, { Draft } from 'immer';
import { useTypedDispatch, setStyleState } from '../../../../application/utils/state_management';
import { LineOptionsDefaults } from '../line_vis_type';
import { Option } from '../../../../application/components/option';
import { BasicVisOptions } from '../../common/basic_vis_options';
import { useVisBuilderContext } from '../../../../application/view_components/context';

function LineVisOptions() {
  const { rootState } = useVisBuilderContext();
  const styleState = rootState.style as LineOptionsDefaults;
  const dispatch = useTypedDispatch();

  const setOption = useCallback(
    (callback: (draft: Draft<typeof styleState>) => void) => {
      const newState = produce(styleState, callback);
      dispatch(setStyleState<LineOptionsDefaults>(newState));
    },
    [dispatch, styleState]
  );

  return (
    <>
      <Option
        title={i18n.translate('visTypeVislib.line.params.settingsTitle', {
          defaultMessage: 'Settings',
        })}
        initialIsOpen
      >
        <BasicVisOptions styleState={styleState} setOption={setOption} />
      </Option>
    </>
  );
}

export { LineVisOptions };
