/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiSuperSelect, EuiSuperSelectOption, EuiIcon } from '@elastic/eui';
import { useVisualizationType } from '../utils/use';
import './side_nav.scss';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WizardServices } from '../../types';
import { setActiveVisualization, useTypedDispatch } from '../utils/state_management';

export const RightNav = () => {
  const {
    services: { types },
  } = useOpenSearchDashboards<WizardServices>();
  const { ui, name: activeVisName } = useVisualizationType();
  const dispatch = useTypedDispatch();
  const StyleSection = ui.containerConfig.style.render;

  const options: Array<EuiSuperSelectOption<string>> = types.all().map(({ name, icon, title }) => ({
    value: name,
    inputDisplay: title,
    dropdownDisplay: (
      <>
        <EuiIcon type={icon} className="wizTypeSelector__icon" />
        <strong>{title}</strong>
      </>
    ),
  }));

  return (
    <section className="wizSidenav right">
      <div className="wizSidenav__header">
        <EuiSuperSelect
          options={options}
          valueOfSelected={activeVisName}
          onChange={(name) => {
            dispatch(
              setActiveVisualization({
                name,
                style: types.get(name)?.ui.containerConfig.style.defaults,
              })
            );
          }}
          fullWidth
        />
      </div>
      <div className="wizSidenav__style">
        <StyleSection />
      </div>
    </section>
  );
};
