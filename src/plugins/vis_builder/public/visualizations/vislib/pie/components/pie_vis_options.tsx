/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import produce, { Draft } from 'immer';
import { useTypedDispatch, useTypedSelector } from '../../../../application/utils/state_management';
import { PieOptionsDefaults } from '../pie_vis_type';
import { setState } from '../../../../application/utils/state_management/style_slice';
import { Option } from '../../../../application/app';
import { BasicVisOptions } from '../../common/basic_vis_options';
import { SwitchOption } from '../../../../../../charts/public';

function PieVisOptions() {
  const styleState = useTypedSelector((state) => state.style) as PieOptionsDefaults;
  const dispatch = useTypedDispatch();

  const setOption = useCallback(
    (callback: (draft: Draft<typeof styleState>) => void) => {
      const newState = produce(styleState, callback);
      dispatch(setState<PieOptionsDefaults>(newState));
    },
    [dispatch, styleState]
  );

  return (
    <>
      <Option
        title={i18n.translate('visBuilder.pie.params.settingsTitle', {
          defaultMessage: 'Settings',
        })}
        initialIsOpen
      >
        <BasicVisOptions styleState={styleState} setOption={setOption} />
        <SwitchOption
          label={i18n.translate('visBuilder.pie.params.isDonutLabel', {
            defaultMessage: 'Donut',
          })}
          paramName="isDonut"
          value={styleState.isDonut}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.isDonut = value;
            })
          }
        />
      </Option>
    </>
  );
}

export { PieVisOptions };
