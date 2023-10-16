/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { Draft } from 'immer';
import { SelectOption, SwitchOption } from '../../../../../charts/public';
import { getConfigCollections } from '../../../../../vis_type_vislib/public';
import { BasicOptionsDefaults } from './types';

interface Props {
  styleState: BasicOptionsDefaults;
  setOption: (callback: (draft: Draft<BasicOptionsDefaults>) => void) => void;
}

export const BasicVisOptions = ({ styleState, setOption }: Props) => {
  const { legendPositions } = getConfigCollections();
  return (
    <>
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
    </>
  );
};
