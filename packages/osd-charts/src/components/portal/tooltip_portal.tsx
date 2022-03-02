/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { createPopper, Instance } from '@popperjs/core';
import { useRef, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { createPortal } from 'react-dom';

import { mergePartial, isDefined } from '../../utils/common';
import { Padding } from '../../utils/dimensions';
import { TooltipPortalSettings, PortalAnchorRef } from './types';
import { DEFAULT_POPPER_SETTINGS, getOrCreateNode, isHTMLElement } from './utils';

/**
 * @todo make this type conditional to use PortalAnchorProps or PortalAnchorRefProps
 */
type PortalTooltipProps = {
  zIndex: number;
  /**
   * String used to designate unique portal
   */
  scope: string;
  /**
   * children to render inside the tooltip
   */
  children: ReactNode;
  /**
   * Used to determine if tooltip is visible
   */
  visible: boolean;
  /**
   * Settings to control portal positioning
   */
  settings?: TooltipPortalSettings;
  /**
   * Anchor element to use as position reference
   */
  anchor: HTMLElement | PortalAnchorRef | null;
  /**
   * Chart Id to add new anchor for each chart on the page
   */
  chartId: string;
};

function addToPadding(padding: Partial<Padding> | number = 0, extra: number = 0): Padding | number | undefined {
  if (typeof padding === 'number') return padding + extra;

  const { top = 0, right = 0, bottom = 0, left = 0 } = padding;

  return {
    top: top + extra,
    right: right + extra,
    bottom: bottom + extra,
    left: left + extra,
  };
}

const TooltipPortalComponent = ({
  anchor,
  scope,
  settings,
  children,
  visible,
  chartId,
  zIndex,
}: PortalTooltipProps) => {
  /**
   * Anchor element used to position tooltip
   */
  const anchorNode = useRef(
    isHTMLElement(anchor)
      ? anchor
      : getOrCreateNode(`echAnchor${scope}__${chartId}`, undefined, anchor?.ref ?? undefined),
  );

  /**
   * This must not be removed from DOM throughout life of this component.
   * Otherwise the portal will loose reference to the correct node.
   */
  const portalNodeElement = getOrCreateNode(
    `echTooltipPortal${scope}__${chartId}`,
    'echTooltipPortal__invisible',
    undefined,
    zIndex,
  );

  const portalNode = useRef(portalNodeElement);

  /**
   * Popper instance used to manage position of tooltip.
   */
  const popper = useRef<Instance | null>(null);

  const popperSettings = useMemo(
    () => mergePartial(DEFAULT_POPPER_SETTINGS, settings, { mergeOptionalPartialValues: true }),

    [settings],
  );

  const anchorPosition = (anchor as PortalAnchorRef)?.position;
  const position = useMemo(() => (isHTMLElement(anchor) ? null : anchorPosition), [anchor, anchorPosition]);

  const destroyPopper = useCallback(() => {
    if (popper.current) {
      popper.current.destroy();
      popper.current = null;
    }
  }, []);

  const setPopper = useCallback(() => {
    if (!isDefined(anchorNode.current) || !visible) {
      return;
    }

    const { fallbackPlacements, placement, boundary, offset, boundaryPadding } = popperSettings;
    popper.current = createPopper(anchorNode.current, portalNode.current, {
      strategy: 'absolute',
      placement,
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, offset],
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundary,
            padding: boundaryPadding,
          },
        },
        {
          name: 'flip',
          options: {
            // Note: duplicate values causes lag
            fallbackPlacements: fallbackPlacements.filter((p) => p !== placement),
            boundary,
            // checks main axis overflow before trying to flip
            altAxis: false,
            padding: addToPadding(boundaryPadding, offset),
          },
        },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visible,
    popperSettings.fallbackPlacements,
    popperSettings.placement,
    popperSettings.boundary,
    popperSettings.offset,
  ]);

  useEffect(() => {
    setPopper();
    const nodeCopy = portalNode.current;

    return () => {
      if (nodeCopy.parentNode) {
        nodeCopy.parentNode.removeChild(nodeCopy);
      }

      destroyPopper();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    destroyPopper();
    setPopper();
  }, [destroyPopper, setPopper, popperSettings]);

  useEffect(() => {
    if (!visible) {
      destroyPopper();
    } else if (!popper.current) {
      setPopper();
    }
  }, [destroyPopper, setPopper, visible]);

  const updateAnchorDimensions = useCallback(() => {
    if (!position || !visible) {
      return;
    }

    const { x, y, width, height } = position;
    anchorNode.current.style.transform = `translate(${x}px, ${y}px)`;

    if (isDefined(width)) {
      anchorNode.current.style.width = `${width}px`;
    }

    if (isDefined(height)) {
      anchorNode.current.style.height = `${height}px`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, anchorNode, position?.x, position?.y, position?.width, position?.height]);

  useEffect(() => {
    if (!position) {
      portalNode.current.classList.add('echTooltipPortal__invisible');
      return;
    }
    portalNode.current.classList.remove('echTooltipPortal__invisible');
  }, [position]);

  useEffect(() => {
    if (popper.current) {
      updateAnchorDimensions();
      void popper.current.update();
    }
  }, [updateAnchorDimensions, popper]);

  return createPortal(children, portalNode.current);
};

TooltipPortalComponent.displayName = 'TooltipPortal';

/** @internal */
export const TooltipPortal = TooltipPortalComponent;
