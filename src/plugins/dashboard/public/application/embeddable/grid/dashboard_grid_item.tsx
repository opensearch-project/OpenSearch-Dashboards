/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { FC } from 'react';
import classNames from 'classnames';
import React from 'react';
import { EmbeddableChildPanel } from '../../../embeddable_plugin';

export const DashboardGridItem: FC<any> = (props: any) => {
  const {
    expandedPanelId,
    focusedPanelIndex,
    id,
    type,
    style,
    gridItems,
    container,
    PanelComponent,
    children,
    className,
  } = props;
  const expandPanel = expandedPanelId !== undefined && expandedPanelId === id;
  const hidePanel = expandedPanelId !== undefined && expandedPanelId !== id;
  const classes = classNames({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'dshDashboardGrid__item--expanded': expandPanel,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'dshDashboardGrid__item--hidden': hidePanel,
  });
  const panelClassName = [classes, className].join(' ');
  return (
    <div
      style={{ ...style, zIndex: focusedPanelIndex === id ? 2 : 'auto' }}
      className={panelClassName}
      key={type}
      data-test-subj="dashboardPanel"
      id={`panel-${id}`}
      ref={(reactGridItem) => {
        gridItems[id] = reactGridItem;
      }}
    >
      <EmbeddableChildPanel
        embeddableId={id}
        container={container}
        PanelComponent={PanelComponent}
      />
      {children}
    </div>
  );
};
