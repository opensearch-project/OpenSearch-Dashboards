/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
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
import { VisBuilderServices } from '../../types';
import {
  ActiveVisPayload,
  setActiveVisualization,
  useTypedDispatch,
  useTypedSelector,
} from '../utils/state_management';
import { getPersistedAggParams } from '../utils/get_persisted_agg_params';

export const RightNavUI = () => {
  const { ui, name: activeVisName } = useVisualizationType();
  const [confirmAggs, setConfirmAggs] = useState<ActiveVisPayload | undefined>();
  const {
    services: { types },
  } = useOpenSearchDashboards<VisBuilderServices>();
  const dispatch = useTypedDispatch();
  const StyleSection = ui.containerConfig.style.render;

  const { activeVisualization } = useTypedSelector((state) => state.visualization);
  const aggConfigParams = useMemo(() => activeVisualization?.aggConfigParams ?? [], [
    activeVisualization,
  ]);

  const handleVisTypeChange = useCallback(
    (newVisName) => {
      const currentVisSchemas = types.get(activeVisName)?.ui.containerConfig.data.schemas.all ?? [];
      const newVisSchemas = types.get(newVisName)?.ui.containerConfig.data.schemas.all ?? [];
      const persistedAggParams = getPersistedAggParams(
        aggConfigParams,
        currentVisSchemas,
        newVisSchemas
      );

      const newVis = {
        name: newVisName,
        aggConfigParams: persistedAggParams,
        style: types.get(newVisName)?.ui.containerConfig.style.defaults,
      };

      if (persistedAggParams.length < aggConfigParams.length) return setConfirmAggs(newVis);

      dispatch(setActiveVisualization(newVis));
    },
    [activeVisName, aggConfigParams, dispatch, types]
  );

  const options: Array<EuiSuperSelectOption<string>> = types.all().map(({ name, icon, title }) => ({
    value: name,
    inputDisplay: <OptionItem icon={icon} title={title} />,
    dropdownDisplay: <OptionItem icon={icon} title={title} />,
    'data-test-subj': `visType-${name}`,
  }));

  return (
    <section className="vbSidenav right">
      <div className="vbSidenav__header">
        <EuiSuperSelect
          options={options}
          valueOfSelected={activeVisName}
          onChange={handleVisTypeChange}
          fullWidth
          data-test-subj="chartPicker"
        />
      </div>
      <div className="vbSidenav__style">
        <StyleSection />
      </div>
      {confirmAggs && (
        <EuiConfirmModal
          title={i18n.translate('visBuilder.rightNav.changeVisType.modalTitle', {
            defaultMessage: 'Change visualization type',
          })}
          confirmButtonText={i18n.translate('visBuilder.rightNav.changeVisType.confirmText', {
            defaultMessage: 'Change type',
          })}
          cancelButtonText={i18n.translate('visBuilder.rightNav.changeVisType.cancelText', {
            defaultMessage: 'Cancel',
          })}
          onCancel={() => setConfirmAggs(undefined)}
          onConfirm={() => {
            dispatch(setActiveVisualization(confirmAggs));

            setConfirmAggs(undefined);
          }}
          maxWidth="300px"
          data-test-subj="confirmVisChangeModal"
        >
          <p>
            <FormattedMessage
              id="visBuilder.rightNav.changeVisType.modalDescription"
              defaultMessage="Certain field configurations may be lost when changing visualization types and you may need to reconfigure those fields. Do you want to continue?"
            />
          </p>
        </EuiConfirmModal>
      )}
    </section>
  );
};

const OptionItem = ({ icon, title }: { icon: IconType; title: string }) => (
  <>
    <EuiIcon type={icon} className="vbTypeSelector__icon" />
    <span>{title}</span>
  </>
);

// The app uses EuiResizableContainer that triggers a rerender for every mouseover action.
// To prevent this child component from unnecessarily rerendering in that instance, it needs to be memoized
export const RightNav = React.memo(RightNavUI);
