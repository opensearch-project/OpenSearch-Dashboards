/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiContextMenu,
  EuiContextMenuPanelItemDescriptor,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiPopover,
} from '@elastic/eui';
import React, { FC, useState, useMemo, Fragment } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WizardServices } from '../../types';
import { useTypedDispatch } from '../utils/state_management';
import { setActiveVisualization } from '../utils/state_management/visualization_slice';
import { useVisualizationType } from '../utils/use';

import hand_field from '../../assets/logos/hand_field.svg';
import fields_bg from '../../assets/logos/fields_bg.svg';

import './workspace.scss';

export const Workspace: FC = ({ children }) => {
  return (
    <section className="wizWorkspace">
      <EuiFlexGroup className="wizCanvasControls">
        <EuiFlexItem grow={false}>
          <TypeSelectorPopover />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiPanel className="wizCanvas">
        {children ? (
          children
        ) : (
          <EuiFlexItem className="wizWorkspace__empty">
            <EuiEmptyPrompt
              title={<h2>Drop some fields here to start</h2>}
              body={
                <Fragment>
                  <p>Drag a field directly to the canvas or axis to generate a visualization.</p>
                  <span className="wizWorkspace__container">
                    <p className="wizWorkspace__fieldSvg">
                      <EuiIcon type={fields_bg} size="original" />
                    </p>
                    <p className="wizWorkspace__handFieldSvg">
                      <EuiIcon type={hand_field} size="original" />
                    </p>
                  </span>
                </Fragment>
              }
            />
          </EuiFlexItem>
        )}
      </EuiPanel>
    </section>
  );
};

const TypeSelectorPopover = () => {
  const [isPopoverOpen, setPopover] = useState(false);
  const {
    services: { types },
  } = useOpenSearchDashboards<WizardServices>();
  const dispatch = useTypedDispatch();
  const visualizationTypes = types.all();
  const activeVisualization = useVisualizationType();

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const panels = useMemo(
    () => [
      {
        id: 0,
        title: 'Chart types',
        items: visualizationTypes.map(
          ({ name, title, icon, description }): EuiContextMenuPanelItemDescriptor => ({
            name: title,
            icon: <EuiIcon type={icon} />,
            onClick: () => {
              closePopover();
              dispatch(setActiveVisualization(name));
            },
            toolTipContent: description,
            toolTipPosition: 'right',
          })
        ),
      },
    ],
    [dispatch, visualizationTypes]
  );

  const button = (
    <EuiButton iconType={activeVisualization?.icon} onClick={onButtonClick}>
      {activeVisualization?.title}
    </EuiButton>
  );

  return (
    <EuiPopover
      id="contextMenuExample"
      ownFocus
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downLeft"
    >
      <EuiContextMenu initialPanelId={0} panels={panels} />
    </EuiPopover>
  );
};
