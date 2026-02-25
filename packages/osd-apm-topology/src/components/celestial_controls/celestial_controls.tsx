/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { ZoomInIcon, ZoomOutIcon, FitViewIcon } from '../../shared/resources';
import { t } from '../../shared/i18n/t';
import { useCelestialControls } from './use_celestial_controls.hook';
/**
 * Control buttons for zooming and fitting the Celestial map view
 */
export const CelestialControls = () => {
  const { onZoomIn, onZoomOut, onFitView } = useCelestialControls();

  // Create direct references to the button elements
  return (
    <div className="osd:flex osd:flex-col osd:gap-2 osd:bg-container-default osd:text-body-secondary osd:p-2 osd:rounded-full osd:shadow-md osd:dark:shadow-md osd:z-50">
      <button
        type="button"
        onClick={onZoomIn}
        className="osd:w-6 osd:h-6 osd:flex osd:items-center osd:justify-center osd:hover:text-interactive osd:transition-all osd:cursor-pointer"
        title={t('controls.zoomIn')}
        aria-label={t('controls.zoomIn')}
      >
        <img src={ZoomInIcon} className="celIcon osd:w-4 osd:h-4" alt="" />
      </button>
      <button
        type="button"
        onClick={onFitView}
        className="osd:w-6 osd:h-6 osd:flex osd:items-center osd:justify-center osd:hover:text-interactive osd:transition-all osd:cursor-pointer"
        title={t('controls.fitView')}
        aria-label={t('controls.fitView')}
      >
        <img src={FitViewIcon} className="celIcon osd:w-4 osd:h-4" alt="" />
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        className="osd:w-6 osd:h-6 osd:flex osd:items-center osd:justify-center osd:hover:text-interactive osd:transition-all osd:cursor-pointer"
        title={t('controls.zoomOut')}
        aria-label={t('controls.zoomOut')}
      >
        <img src={ZoomOutIcon} className="celIcon osd:w-4 osd:h-4" alt="" />
      </button>
    </div>
  );
};
