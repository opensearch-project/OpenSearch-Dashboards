/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import './resizable_button.scss';
import { getPosition, calculateNewPaddingSize, MIN_SIDECAR_SIZE } from '../helper';
import { ISidecarConfig, SIDECAR_DOCKED_MODE } from '../sidecar_service';
import { debounce } from '../../../../../core/public/utils';

interface Props {
  onResize: (size: number) => void;
  flyoutSize: number;
  dockedMode: ISidecarConfig['dockedMode'] | undefined;
}

const RESIZE_DEBOUNCE_DELAY = 50;

export const ResizableButton = ({ dockedMode, onResize, flyoutSize }: Props) => {
  const isHorizontal = dockedMode !== SIDECAR_DOCKED_MODE.TAKEOVER;

  const classes = classNames('sidecar-resizableButton', {
    'resizableButton--vertical': !isHorizontal,
    'resizableButton--horizontal': isHorizontal,
  });

  const initialMouseXorY = useRef(0);
  const initialFlyoutSize = useRef(flyoutSize);
  const setFocus = (e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.focus();

  const currentFlyoutSize = useRef(flyoutSize);
  currentFlyoutSize.current = flyoutSize;

  useEffect(() => {
    const debouncedResize = debounce(() => {
      const currentSize = currentFlyoutSize.current;

      if (currentSize > MIN_SIDECAR_SIZE) {
        // Make sure flyout never below min size even if the window goes below the size
        const newPaddingSize = calculateNewPaddingSize(dockedMode, currentSize);
        if (currentSize > newPaddingSize) {
          onResize(newPaddingSize);
        }
      }
    }, RESIZE_DEBOUNCE_DELAY);

    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, [dockedMode, onResize]);

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
        if (
          e instanceof MouseEvent &&
          (e.clientX < 0 ||
            e.clientX > window.innerWidth ||
            e.clientY < 0 ||
            e.clientY > window.innerHeight)
        ) {
          // Stop resize calculation if the user mouse move out of window
          return;
        }

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
