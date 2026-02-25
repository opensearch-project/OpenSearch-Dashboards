/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, useRef } from 'react';
import { LegendIcon } from '../../shared/resources';
import { t } from '../../shared/i18n/t';
import { LegendPanel } from './legend_panel';
import { Portal } from '../portal';
import { useLegend } from './hooks/use_legend.hook';
import { useOnClickOutside } from '../../shared/hooks/use_on_click_outside.hook';

export const Legend: React.FC<{ showSliSlo?: boolean; children?: ReactNode }> = ({
  showSliSlo,
  children,
}) => {
  const { ref, isOpen, position, onClose, onToggle } = useLegend();
  const customRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(customRef, onClose);

  return (
    <>
      {/* Legend Icon Button */}
      <button
        ref={ref}
        onClick={onToggle}
        className="osd:flex osd:items-center osd:justify-center osd:w-10 osd:h-10 osd:rounded-full osd:bg-container-default osd:shadow-md osd:hover:shadow-xl osd:text-body-secondary osd:hover:text-interactive osd:transition-all osd:duration-300 osd:cursor-pointer"
        aria-label={t(`legend.toggle`)}
      >
        <img src={LegendIcon} className="celIcon" alt="" />
      </button>

      {/* Legend Popup */}
      {isOpen && (
        <Portal position={position ?? {}}>
          {children ? (
            <div ref={customRef}>{children}</div>
          ) : (
            <LegendPanel onClose={onClose} showSliSlo={showSliSlo} />
          )}
        </Portal>
      )}
    </>
  );
};
