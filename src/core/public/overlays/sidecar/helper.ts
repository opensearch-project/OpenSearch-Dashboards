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
