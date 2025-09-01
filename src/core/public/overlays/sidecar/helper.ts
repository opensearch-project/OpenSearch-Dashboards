/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISidecarConfig, SIDECAR_DOCKED_MODE } from './sidecar_service';

function isMouseEvent(
  event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent
): event is MouseEvent | React.MouseEvent {
  return typeof event === 'object' && 'pageX' in event && 'pageY' in event;
}

export const MIN_SIDECAR_SIZE = 350;

export const getPosition = (
  event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
  isHorizontal: boolean
) => {
  const clientX = isMouseEvent(event) ? event.clientX : event.touches[0].clientX;
  const clientY = isMouseEvent(event) ? event.clientY : event.touches[0].clientY;
  return isHorizontal ? clientX : clientY;
};

export const getOsdSidecarPaddingStyle = (config: ISidecarConfig | undefined) => {
  if (
    !config?.isHidden &&
    (config?.dockedMode === SIDECAR_DOCKED_MODE.LEFT ||
      config?.dockedMode === SIDECAR_DOCKED_MODE.RIGHT)
  ) {
    const { dockedMode, paddingSize } = config;
    return {
      [`padding${dockedMode === SIDECAR_DOCKED_MODE.LEFT ? 'Left' : 'Right'}`]: paddingSize,
    };
  }
  return {};
};

export const getSidecarLeftNavStyle = (config: ISidecarConfig | undefined) => {
  // Only left style is required for left nav
  if (!config?.isHidden && config?.dockedMode === SIDECAR_DOCKED_MODE.LEFT) {
    const { paddingSize } = config;
    return {
      left: paddingSize,
    };
  }
  return {};
};

export const calculateNewPaddingSize = (
  dockedMode: SIDECAR_DOCKED_MODE | undefined,
  currentSize: number
): number => {
  let paddingSize = currentSize;
  // Make sure flyout never below min size even if the window goes below the size
  if (dockedMode === SIDECAR_DOCKED_MODE.TAKEOVER && currentSize > window.innerHeight) {
    // Automatically reduce the height in full screen mode when resize the window
    paddingSize = window.innerHeight;
  } else if (
    (dockedMode === SIDECAR_DOCKED_MODE.LEFT || dockedMode === SIDECAR_DOCKED_MODE.RIGHT) &&
    currentSize > window.innerWidth
  ) {
    // Automatically reduce the width in left or right docked mode when resize the window
    paddingSize = window.innerWidth;
  }
  // Make sure the padding size never goes below minimum size
  return Math.max(paddingSize, MIN_SIDECAR_SIZE);
};
