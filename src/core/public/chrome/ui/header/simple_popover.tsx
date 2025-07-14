/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, cloneElement, useCallback, useRef } from 'react';
import { EuiPopover, EuiPopoverProps } from '@elastic/eui';
import { useEffect } from 'react';

interface SimplePopoverProps extends Partial<EuiPopoverProps> {
  button: React.ReactElement;
}

const loopToGetPath = (element: HTMLElement | ParentNode | null) => {
  if (!element) {
    return [];
  }
  const path = [element];
  while ((element = element.parentNode)) {
    path.push(element);
  }
  return path;
};

export const SimplePopover: React.FC<SimplePopoverProps> = (props) => {
  const { ...others } = props;
  const [popVisible, setPopVisible] = useState(false);
  const popoverRef = useRef(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const buttonProps: Partial<React.HTMLAttributes<HTMLButtonElement>> = {};
  buttonProps.onMouseEnter = () => {
    setPopVisible(true);
  };

  const outsideHover = useCallback(
    (e) => {
      if (popVisible && popoverRef.current && panelRef.current) {
        const path = loopToGetPath(e.target as HTMLElement);
        if (!(path.includes(popoverRef.current) || path.includes(panelRef.current))) {
          setPopVisible(false);
        }
      }
    },
    [popVisible, setPopVisible]
  );

  useEffect(() => {
    if (popVisible) {
      window.addEventListener('mousemove', outsideHover);
    }
    return () => {
      window.removeEventListener('mousemove', outsideHover);
    };
  }, [popVisible, outsideHover]);

  return (
    <EuiPopover
      {...others}
      popoverRef={popoverRef}
      panelRef={(ref) => (panelRef.current = ref)}
      button={props.button && cloneElement(props.button, buttonProps)}
      isOpen={popVisible}
      closePopover={() => {}}
    />
  );
};
