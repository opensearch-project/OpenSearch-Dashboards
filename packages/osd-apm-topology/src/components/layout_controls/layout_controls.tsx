/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { ExpandAllIcon, LayoutIcon } from '../../shared/resources';
import { t } from '../../shared/i18n/t';
import { useLayoutControls } from './use_layout_controls.hook';
/**
 * Control buttons for zooming and fitting the Celestial map view
 */
export const LayoutControls = () => {
  const { onLayoutChange, onExpandAll } = useLayoutControls();

  // Create direct references to the button elements
  return (
    <div className="osd:flex osd:flex-col osd:gap-2 osd:bg-container-default osd:text-body-secondary osd:p-2 osd:rounded-full osd:shadow-md osd:dark:shadow-md osd:z-50">
      <button
        type="button"
        onClick={onLayoutChange}
        className="osd:w-6 osd:h-6 osd:flex osd:items-center osd:justify-center osd:hover:text-interactive osd:transition-all osd:cursor-pointer"
        title={t('controls.layout')}
        aria-label={t('controls.layout')}
      >
        <img src={LayoutIcon} className="celIcon osd:w-4 osd:h-4" alt="" />
      </button>
      <button
        type="button"
        onClick={onExpandAll}
        className="osd:w-6 osd:h-6 osd:flex osd:items-center osd:justify-center osd:hover:text-interactive osd:transition-all osd:cursor-pointer"
        title={t('controls.expandAll')}
        aria-label={t('controls.expandAll')}
      >
        <img src={ExpandAllIcon} className="celIcon osd:w-4 osd:h-4" alt="" />
      </button>
    </div>
  );
};
