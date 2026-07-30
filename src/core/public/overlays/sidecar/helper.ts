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
    // 8px adjustment needed for newTopNavHeader to match other elements
    const adjustedPaddingSize = paddingSize + 8;
    return {
      [`padding${dockedMode === SIDECAR_DOCKED_MODE.LEFT ? 'Left' : 'Right'}`]: adjustedPaddingSize,
    };
  }
  return {};
};

// Names of the CSS custom properties OUI's EuiFlyout / EuiGlobalToastList /
// EuiBottomBar read to shift out of the way of a docked sidecar. OUI's build
// pipeline aliases `oui-*` -> `eui-*` in the compiled CSS it ships, and that
// alias pass only rewrites CSS source text, never runtime JS -- so we write
// both prefixes to cover whichever theme build is being served.
const OVERLAY_OFFSET_RIGHT_VARS = ['--oui-overlay-offset-right', '--eui-overlay-offset-right'];
const OVERLAY_OFFSET_LEFT_VARS = ['--oui-overlay-offset-left', '--eui-overlay-offset-left'];

/**
 * Reflect the docked sidecar's reserved width onto document root CSS variables
 * so OUI components positioned against the raw viewport edge (which live
 * outside #app-wrapper and therefore don't see the padding applied to it)
 * shift left/right instead of rendering underneath the sidecar. Resets to 0
 * when the sidecar is hidden, closed (undefined), or in takeover mode.
 */
export const applyOverlayOffsetCssVars = (config: ISidecarConfig | undefined): void => {
  if (typeof document === 'undefined') return;

  let right = 0;
  let left = 0;
  if (!config?.isHidden) {
    if (config?.dockedMode === SIDECAR_DOCKED_MODE.RIGHT) {
      right = config.paddingSize;
    } else if (config?.dockedMode === SIDECAR_DOCKED_MODE.LEFT) {
      left = config.paddingSize;
    }
  }

  const { style } = document.documentElement;
  OVERLAY_OFFSET_RIGHT_VARS.forEach((name) => style.setProperty(name, `${right}px`));
  OVERLAY_OFFSET_LEFT_VARS.forEach((name) => style.setProperty(name, `${left}px`));
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
