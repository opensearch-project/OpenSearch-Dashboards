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
import React, { FC, useState, useMemo, useEffect, Fragment } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WizardServices } from '../../types';
import { validateSchemaState } from '../utils/validate_schema_state';
import { useTypedDispatch, useTypedSelector } from '../utils/state_management';
import { setActiveVisualization } from '../utils/state_management/visualization_slice';
import { useVisualizationType } from '../utils/use';

import hand_field from '../../assets/hand_field.svg';
import fields_bg from '../../assets/fields_bg.svg';

import './workspace.scss';

export const Workspace: FC = ({ children }) => {
  const {
    services: {
      expressions: { ReactExpressionRenderer },
      notifications: { toasts },
    },
  } = useOpenSearchDashboards<WizardServices>();
  const { toExpression, ui } = useVisualizationType();
  const [expression, setExpression] = useState<string>();
  const rootState = useTypedSelector((state) => state);

  useEffect(() => {
    async function loadExpression() {
      const schemas = ui.containerConfig.data.schemas;
      const [valid, errorMsg] = validateSchemaState(schemas, rootState);

      if (!valid) {
        if (errorMsg) {
          toasts.addWarning(errorMsg);
        }
        setExpression(undefined);
        return;
      }
      const exp = await toExpression(rootState);
      setExpression(exp);
    }

    loadExpression();
  }, [rootState, toExpression, toasts, ui.containerConfig.data.schemas]);

  return (
    <section className="wizWorkspace">
      <EuiFlexGroup className="wizCanvasControls">
        <EuiFlexItem grow={false}>
          <TypeSelectorPopover />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiPanel className="wizCanvas">
        {expression ? (
          <ReactExpressionRenderer expression={expression} />
        ) : (
          <EuiFlexItem className="wizWorkspace__empty">
            <EuiEmptyPrompt
              title={<h2>Drop some fields here to start</h2>}
              body={
                <Fragment>
                  <p>Drag a field directly to the canvas or axis to generate a visualization.</p>
                  <span className="wizWorkspace__container">
                    <EuiIcon className="wizWorkspace__fieldSvg" type={fields_bg} size="original" />
                    <EuiIcon
                      className="wizWorkspace__handFieldSvg"
                      type={hand_field}
                      size="original"
                    />
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
              // TODO: Fix changing viz type
              // dispatch(setActiveVisualization(name));
            },
            toolTipContent: description,
            toolTipPosition: 'right',
          })
        ),
      },
    ],
    [visualizationTypes]
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
