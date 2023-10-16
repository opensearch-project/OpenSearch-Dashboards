/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import produce, { Draft } from 'immer';
import { useTypedDispatch, setStyleState } from '../../../../application/utils/state_management';
import { AreaOptionsDefaults } from '../area_vis_type';
import { Option } from '../../../../application/components/option';
import { BasicVisOptions } from '../../common/basic_vis_options';
import { useVisBuilderContext } from '../../../../application/view_components/context';

function AreaVisOptions() {
  const { rootState } = useVisBuilderContext();
  const styleState = rootState.style as AreaOptionsDefaults;
  const dispatch = useTypedDispatch();

  const setOption = useCallback(
    (callback: (draft: Draft<typeof styleState>) => void) => {
      const newState = produce(styleState, callback);
      dispatch(setStyleState<AreaOptionsDefaults>(newState));
    },
    [dispatch, styleState]
  );

  return (
    <>
      <Option
        title={i18n.translate('visTypeVislib.area.params.settingsTitle', {
          defaultMessage: 'Settings',
        })}
        initialIsOpen
      >
        <BasicVisOptions styleState={styleState} setOption={setOption} />
      </Option>
    </>
  );
}

export { AreaVisOptions };
