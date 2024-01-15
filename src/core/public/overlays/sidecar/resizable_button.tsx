/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef } from 'react';
import classNames from 'classnames';
import './rsizable_button.scss';
import { getPosition } from './helper';
import { ISidecarConfig } from './sidecar_service';

interface Props {
  isHorizontal: boolean;
  onResize: (size: number) => void;
  flyoutSize: number;
  dockedDirection: ISidecarConfig['dockedDirection'] | undefined;
  minSize?: number;
}

const MIN_SIDECAR_SIZE = 200;

export const ResizableButton = ({
  dockedDirection,
  onResize,
  flyoutSize,
  minSize = MIN_SIDECAR_SIZE,
}: Props) => {
  const isHorizontal = dockedDirection !== 'bottom';

  const classes = classNames('resizableButton', {
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
        if (dockedDirection === 'left') {
          offset = getPosition(e, isHorizontal) - initialMouseXorY.current;
        } else {
          offset = initialMouseXorY.current - getPosition(e, isHorizontal);
        }
        const newFlyoutSize = initialFlyoutSize.current + offset;

        onResize(Math.max(newFlyoutSize, minSize));
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onMouseMove);
      window.addEventListener('touchend', onMouseUp);
      initialMouseXorY.current = getPosition(event, isHorizontal);
      initialFlyoutSize.current = flyoutSize;
    },
    [isHorizontal, flyoutSize, dockedDirection, minSize, onResize]
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
