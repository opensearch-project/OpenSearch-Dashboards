/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { StyleAccordion } from '../style_panel/style_accordion';
import { StackMode } from '../types';
import { StackModeButtonGroup } from '../style_panel/share/index';

interface AreaExclusiveVisOptionsProps {
  stackMode?: StackMode;
  onStackModeChange: (stackMode: StackMode) => void;
  isTimeBased?: boolean;
}

export const AreaExclusiveVisOptions = ({
  stackMode = 'none',

  onStackModeChange,
  isTimeBased = true,
}: AreaExclusiveVisOptionsProps) => {
  return (
    <StyleAccordion
      id="areaSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.area', {
        defaultMessage: 'Area',
      })}
      initialIsOpen={true}
    >
      <StackModeButtonGroup
        stackMode={stackMode}
        onStackModeChange={onStackModeChange}
        testsubj="areaStackMode"
      />
    </StyleAccordion>
  );
};
