/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { SelectOption, SwitchOption } from '../../../../../../charts/public';
import { getPositions } from '../utils/collections';

interface BasicVisOptionsProps {
  addTooltip: boolean;
  addLegend: boolean;
  legendPosition: string;
  addTimeMarker: boolean;
  onAddTooltipChange: (addTooltip: boolean) => void;
  onAddLegendChange: (addLegend: boolean) => void;
  onLegendPositionChange: (legendPosition: string) => void;
  onAddTimeMarkerChange: (addTimeMarker: boolean) => void;
}

export const BasicVisOptions = ({
  addTooltip,
  addLegend,
  legendPosition,
  addTimeMarker,
  onAddTooltipChange,
  onAddLegendChange,
  onLegendPositionChange,
  onAddTimeMarkerChange,
}: BasicVisOptionsProps) => {
  // Could import and reuse { getConfigCollections } from '../../../../../vis_type_vislib/public';
  // That requires adding vis_type_vislib as a dependency to discover, and somehow that throw errors
  const legendPositions = getPositions();

  return (
    <>
      <SwitchOption
        label={i18n.translate('discover.stylePanel.basic.showLegend', {
          defaultMessage: 'Show legend',
        })}
        paramName="addLegend"
        value={addLegend}
        setValue={(_, value) => onAddLegendChange(value)}
      />

      {addLegend && (
        <SelectOption
          label={i18n.translate('discover.stylePanel.basic.legendPosition', {
            defaultMessage: 'Legend position',
          })}
          options={legendPositions}
          paramName="legendPosition"
          value={legendPosition}
          setValue={(_, value) => onLegendPositionChange(value)}
        />
      )}

      <SwitchOption
        label={i18n.translate('discover.stylePanel.basic.showTooltip', {
          defaultMessage: 'Show tooltip',
        })}
        paramName="addTooltip"
        value={addTooltip}
        setValue={(_, value) => onAddTooltipChange(value)}
      />

      <SwitchOption
        label={i18n.translate('discover.stylePanel.basic.showTimeMarker', {
          defaultMessage: 'Show current time marker',
        })}
        paramName="addTimeMarker"
        value={addTimeMarker}
        setValue={(_, value) => onAddTimeMarkerChange(value)}
      />
    </>
  );
};
