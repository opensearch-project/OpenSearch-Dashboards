/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef } from 'react';
import classNames from 'classnames';
import './resizable_button.scss';
import { getPosition } from '../helper';
import { ISidecarConfig, SIDECAR_DOCKED_MODE } from '../sidecar_service';

interface Props {
  onResize: (size: number) => void;
  flyoutSize: number;
  dockedMode: ISidecarConfig['dockedMode'] | undefined;
}

export const MIN_SIDECAR_SIZE = 350;

export const ResizableButton = ({ dockedMode, onResize, flyoutSize }: Props) => {
  const isHorizontal = dockedMode !== SIDECAR_DOCKED_MODE.TAKEOVER;

  const classes = classNames('sidecar-resizableButton', {
    'resizableButton--vertical': !isHorizontal,
    'resizableButton--horizontal': isHorizontal,
  });

  const initialMouseXorY = useRef(0);
  const initialFlyoutSize = useRef(flyoutSize);
  const setFocus = (e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.focus();

  const onMouseDown = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      const onMouseUp = () => {
        initialMouseXorY.current = 0;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onMouseMove);
        window.removeEventListener('touchend', onMouseUp);
      };
      const onMouseMove = (e: MouseEvent | TouchEvent) => {
        let offset;
        if (dockedMode === SIDECAR_DOCKED_MODE.LEFT) {
          offset = getPosition(e, isHorizontal) - initialMouseXorY.current;
        } else {
          offset = initialMouseXorY.current - getPosition(e, isHorizontal);
        }
        const newFlyoutSize = initialFlyoutSize.current + offset;

        onResize(Math.max(newFlyoutSize, MIN_SIDECAR_SIZE));
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onMouseMove);
      window.addEventListener('touchend', onMouseUp);
      initialMouseXorY.current = getPosition(event, isHorizontal);
      initialFlyoutSize.current = flyoutSize;
    },
    [isHorizontal, flyoutSize, dockedMode, onResize]
  );

  return (
    <button
      className={classes}
      data-test-subj="resizableButton"
      type="button"
      onClick={setFocus}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
    />
  );
};
