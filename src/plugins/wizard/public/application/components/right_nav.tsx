/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiSuperSelect,
  EuiSuperSelectOption,
  EuiIcon,
  IconType,
  EuiConfirmModal,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { useVisualizationType } from '../utils/use';
import './side_nav.scss';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WizardServices } from '../../types';
import { setActiveVisualization, useTypedDispatch } from '../utils/state_management';

export const RightNav = () => {
  const [newVisType, setNewVisType] = useState<string>();
  const {
    services: { types },
  } = useOpenSearchDashboards<WizardServices>();
  const { ui, name: activeVisName } = useVisualizationType();
  const dispatch = useTypedDispatch();
  const StyleSection = ui.containerConfig.style.render;

  const options: Array<EuiSuperSelectOption<string>> = types.all().map(({ name, icon, title }) => ({
    value: name,
    inputDisplay: <OptionItem icon={icon} title={title} />,
    dropdownDisplay: <OptionItem icon={icon} title={title} />,
    'data-test-subj': `visType-${name}`,
  }));

  return (
    <section className="wizSidenav right">
      <div className="wizSidenav__header">
        <EuiSuperSelect
          options={options}
          valueOfSelected={activeVisName}
          onChange={(name) => {
            setNewVisType(name);
          }}
          fullWidth
          data-test-subj="chartPicker"
        />
      </div>
      <div className="wizSidenav__style">
        <StyleSection />
      </div>
      {newVisType && (
        <EuiConfirmModal
          title={i18n.translate('wizard.rightNav.changeVisType.modalTitle', {
            defaultMessage: 'Change visualization type',
          })}
          confirmButtonText={i18n.translate('wizard.rightNav.changeVisType.confirmText', {
            defaultMessage: 'Change type',
          })}
          cancelButtonText={i18n.translate('wizard.rightNav.changeVisType.cancelText', {
            defaultMessage: 'Cancel',
          })}
          onCancel={() => setNewVisType(undefined)}
          onConfirm={() => {
            dispatch(
              setActiveVisualization({
                name: newVisType,
                style: types.get(newVisType)?.ui.containerConfig.style.defaults,
              })
            );

            setNewVisType(undefined);
          }}
          maxWidth="300px"
          data-test-subj="confirmVisChangeModal"
        >
          <p>
            <FormattedMessage
              id="wizard.rightNav.changeVisType.modalDescription"
              defaultMessage="Changing the visualization type will reset all field selections. Do you want to continue?"
            />
          </p>
        </EuiConfirmModal>
      )}
    </section>
  );
};

const OptionItem = ({ icon, title }: { icon: IconType; title: string }) => (
  <>
    <EuiIcon type={icon} className="wizTypeSelector__icon" />
    <span>{title}</span>
  </>
);
