/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiPanel, EuiText, EuiTitle } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useCallback } from 'react';
import { IndexPatternField } from 'src/plugins/data/common';
import { useDrop } from '../../utils/drag_drop';
import { useTypedDispatch, useTypedSelector } from '../../utils/state_management';
import {
  addConfigSectionField,
  removeConfigSectionField,
} from '../../utils/state_management/config_slice';

import './config_section.scss';

interface ConfigSectionProps {
  id: string;
  title: string;
}

export const ConfigSection = ({ title, id }: ConfigSectionProps) => {
  const dispatch = useTypedDispatch();
  const { fields } = useTypedSelector((state) => state.config.configSections[id]);

  const dropHandler = useCallback(
    (field: IndexPatternField) => {
      dispatch(
        addConfigSectionField({
          sectionId: id,
          field,
        })
      );
    },
    [dispatch, id]
  );
  const [dropProps, { isValidDropTarget, dragData }] = useDrop('dataPlane', dropHandler);

  const dropTargetString = dragData
    ? dragData.type
    : i18n.translate('wizard.nav.dataTab.configPanel.dropTarget.placeholder', {
        defaultMessage: 'Click or drop to add',
      });

  return (
    <div className="wizConfigSection">
      <EuiTitle size="xxxs">
        <h3 className="wizConfigSection__title">{title}</h3>
      </EuiTitle>
      {fields.length ? (
        fields.map((field, index) => (
          <EuiPanel key={index} paddingSize="s" className="wizConfigSection__field">
            <EuiText grow size="m">
              {field.displayName}
            </EuiText>
            <EuiButtonIcon
              color="danger"
              iconType="cross"
              aria-label="clear-field"
              onClick={() =>
                dispatch(
                  removeConfigSectionField({
                    sectionId: id,
                    field,
                  })
                )
              }
            />
          </EuiPanel>
        ))
      ) : (
        <div
          className={`wizConfigSection__dropTarget ${isValidDropTarget && 'validDropTarget'}`}
          {...dropProps}
        >
          <EuiText size="s">{dropTargetString}</EuiText>
        </div>
      )}
    </div>
  );
};
