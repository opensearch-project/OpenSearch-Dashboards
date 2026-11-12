/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiComboBox, EuiComboBoxOptionOption, EuiFormRow, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { AllTransformationInstance } from './types';

export const isSingleSeriesInstance = (instance: AllTransformationInstance) =>
  'transformationMethod' in instance;

/**
 * Whether a step offers "Apply to": single-series steps only, once there's more than one query's
 * series to choose from (or a choice was already made, so it can be undone).
 */

export const showApplyToSelector = (instance: AllTransformationInstance, refIds: string[]) =>
  isSingleSeriesInstance(instance) &&
  (refIds.length > 1 || (!!instance.applyTo && !refIds.includes(instance.applyTo)));

interface ApplyToSelectorProps {
  applyTo?: string;
  refIds: string[];
  onChange: (refId: string | undefined) => void;
}

const queryLabel = (refId: string) =>
  i18n.translate('explore.transformations.applyTo.query', {
    defaultMessage: 'Query {refId}',
    values: { refId },
  });

/**
 * Picks the query a single-series step runs on. No pick shows the "Select a query" placeholder;
 */
export const ApplyToSelector = ({ applyTo, refIds, onChange }: ApplyToSelectorProps) => {
  const options: Array<EuiComboBoxOptionOption<string>> = refIds.map((refId) => ({
    label: queryLabel(refId),
    value: refId,
  }));
  // Keep a choice whose series is gone (hidden, removed, merged), so it shows.
  if (applyTo && !refIds.includes(applyTo)) {
    options.push({
      label: i18n.translate('explore.transformations.applyTo.unavailableQuery', {
        defaultMessage: 'Query {refId} (not available)',
        values: { refId: applyTo },
      }),
      value: applyTo,
    });
  }

  return (
    <>
      <EuiFormRow
        label={i18n.translate('explore.transformations.applyTo.label', {
          defaultMessage: 'Apply to',
        })}
        display="columnCompressed"
      >
        <EuiComboBox<string>
          compressed
          singleSelection={{ asPlainText: true }}
          isClearable
          placeholder={i18n.translate('explore.transformations.applyTo.selectQuery', {
            defaultMessage: 'Select a query',
          })}
          options={options}
          selectedOptions={options.filter(({ value }) => value === applyTo)}
          onChange={([picked]) => onChange(picked?.value)}
          isInvalid={!applyTo}
          data-test-subj="transformationApplyToSelect"
        />
      </EuiFormRow>
      <EuiSpacer size="s" />
    </>
  );
};
