/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, cloneElement, useCallback, useRef } from 'react';
import { EuiPopover, EuiPopoverProps } from '@elastic/eui';
import { useEffect } from 'react';

interface SimplePopoverProps extends Partial<EuiPopoverProps> {
  triggerType?: 'click' | 'hover';
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
  const { triggerType = 'click', ...others } = props;
  const [popVisible, setPopVisible] = useState(false);
  const popoverRef = useRef(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const buttonProps: Partial<React.HTMLAttributes<HTMLButtonElement>> = {};
  const destroyRef = useRef<boolean>(false);
  if (triggerType === 'click') {
    buttonProps.onClick = (e) => {
      e.stopPropagation();
      setPopVisible(!popVisible);
    };
  }

  if (triggerType === 'hover') {
    buttonProps.onMouseEnter = () => {
      setPopVisible(true);
    };
  }

  const outsideClick = useCallback(() => {
    setPopVisible(false);
  }, [setPopVisible]);

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
    if (popVisible && triggerType === 'click') {
      window.addEventListener('click', outsideClick);
    }
    return () => {
      window.removeEventListener('click', outsideClick);
    };
  }, [popVisible, outsideClick, triggerType]);

  useEffect(() => {
    if (popVisible && triggerType === 'hover') {
      window.addEventListener('mousemove', outsideHover);
    }
    return () => {
      window.removeEventListener('mousemove', outsideHover);
    };
  }, [popVisible, outsideHover, triggerType]);

  useEffect(() => {
    return () => {
      destroyRef.current = true;
    };
  }, []);

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
