/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFieldNumber,
  EuiFieldText,
  EuiFormRow,
  EuiLink,
  EuiSelect,
  EuiSpacer,
  EuiSuperSelect,
  EuiText,
} from '@elastic/eui';
import producer from 'immer';
import React, { ChangeEvent, Fragment, useState } from 'react';
import {
  ACC_CHECKPOINT_DOCUMENTATION_URL,
  ACCELERATION_REFRESH_TIME_INTERVAL,
  ACCELERATION_TIME_INTERVAL,
} from '../../../../../framework/constants';
import { AccelerationRefreshType, CreateAccelerationForm } from '../../../../../framework/types';
import {
  hasError,
  validateCheckpointLocation,
  validateRefreshInterval,
  validateWatermarkDelay,
} from '../create/utils';
import { DefineIndexOptions } from './define_index_options';

interface IndexSettingOptionsProps {
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
}

export const IndexSettingOptions = ({
  accelerationFormData,
  setAccelerationFormData,
}: IndexSettingOptionsProps) => {
  const refreshOptions = [
    {
      value: 'autoInterval',
      inputDisplay: 'Auto (Interval)',
      dropdownDisplay: (
        <Fragment>
          <strong>Auto (Interval)</strong>
          <EuiText size="s" color="subdued">
            <p className="EuiTextColor--subdued">
              Automatically refreshes the index and specifies the interval between micro-batches.
            </p>
          </EuiText>
        </Fragment>
      ),
    },
    {
      value: 'manualIncrement',
      inputDisplay: 'Manual (Increment)',
      dropdownDisplay: (
        <Fragment>
          <strong>Manual (Increment)</strong>
          <EuiText size="s" color="subdued">
            <p className="EuiTextColor--subdued">
              Manually fetches new data since last refresh. Ideal for reducing resource usage.
            </p>
          </EuiText>
        </Fragment>
      ),
    },
    {
      value: 'manual',
      inputDisplay: 'Manual',
      dropdownDisplay: (
        <Fragment>
          <strong>Manual</strong>
          <EuiText size="s" color="subdued">
            <p className="EuiTextColor--subdued">Manually fetches all available data.</p>
          </EuiText>
        </Fragment>
      ),
    },
  ];

  const [refreshTypeSelected, setRefreshTypeSelected] = useState<AccelerationRefreshType>(
    'autoInterval'
  );
  const [refreshWindow, setRefreshWindow] = useState(15);
  const [refreshInterval, setRefreshInterval] = useState(
    ACCELERATION_REFRESH_TIME_INTERVAL[0].value
  );
  const [delayWindow, setDelayWindow] = useState(1);
  const [delayInterval, setDelayInterval] = useState(ACCELERATION_TIME_INTERVAL[2].value);
  const [checkpoint, setCheckpoint] = useState('');

  const onChangeRefreshType = (optionId: AccelerationRefreshType) => {
    setAccelerationFormData(
      producer((accData) => {
        accData.refreshType = optionId;
        accData.formErrors.checkpointLocationError = [];
        accData.formErrors.refreshIntervalError = [];
      })
    );
    setRefreshTypeSelected(optionId);
  };

  const onChangeRefreshWindow = (e: ChangeEvent<HTMLInputElement>) => {
    const windowCount = parseInt(e.target.value, 10);
    setAccelerationFormData(
      producer((accData) => {
        accData.refreshIntervalOptions.refreshWindow = windowCount;
      })
    );
    setRefreshWindow(windowCount);
  };

  const onChangeDelayWindow = (e: ChangeEvent<HTMLInputElement>) => {
    const windowCount = parseInt(e.target.value, 10);
    setAccelerationFormData(
      producer((accData) => {
        accData.watermarkDelay.delayWindow = windowCount;
      })
    );
    setDelayWindow(windowCount);
  };

  const onChangeRefreshInterval = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const refreshIntervalValue = e.target.value;
    setAccelerationFormData(
      producer((accData) => {
        accData.refreshIntervalOptions.refreshInterval = refreshIntervalValue;
      })
    );
    setRefreshInterval(refreshIntervalValue);
  };

  const onChangeDelayInterval = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const delayIntervalValue = e.target.value;
    setAccelerationFormData(
      producer((accData) => {
        accData.watermarkDelay.delayInterval = delayIntervalValue;
      })
    );
    setDelayInterval(delayIntervalValue);
  };

  const onChangeCheckpoint = (e: ChangeEvent<HTMLInputElement>) => {
    const checkpointLocation = e.target.value;
    setAccelerationFormData({ ...accelerationFormData, checkpointLocation });
    setCheckpoint(checkpointLocation);
  };

  return (
    <>
      <EuiText data-test-subj="define-index-header">
        <h3>Define Index</h3>
      </EuiText>
      <EuiSpacer size="s" />
      {accelerationFormData.accelerationIndexType !== 'skipping' && (
        <DefineIndexOptions
          accelerationFormData={accelerationFormData}
          setAccelerationFormData={setAccelerationFormData}
        />
      )}
      <EuiFormRow
        label="Refresh type"
        helpText="Specify how often the index should refresh, which publishes the most recent changes and make them available for search."
      >
        <EuiSuperSelect
          options={refreshOptions}
          valueOfSelected={refreshTypeSelected}
          onChange={onChangeRefreshType}
          itemLayoutAlign="top"
          hasDividers
        />
      </EuiFormRow>
      {refreshTypeSelected === 'autoInterval' && (
        <EuiFormRow
          label="Refresh increments"
          helpText="Specify how frequent the index gets updated when performing the refresh job."
          isInvalid={hasError(accelerationFormData.formErrors, 'refreshIntervalError')}
          error={accelerationFormData.formErrors.refreshIntervalError}
        >
          <EuiFieldNumber
            placeholder="Refresh increments"
            value={refreshWindow}
            onChange={onChangeRefreshWindow}
            aria-label="Refresh increments"
            min={1}
            isInvalid={hasError(accelerationFormData.formErrors, 'refreshIntervalError')}
            onBlur={(e) => {
              setAccelerationFormData(
                producer((accData) => {
                  accData.formErrors.refreshIntervalError = validateRefreshInterval(
                    refreshTypeSelected,
                    parseInt(e.target.value, 10),
                    refreshInterval
                  );
                })
              );
            }}
            append={
              <EuiSelect
                value={refreshInterval}
                onChange={onChangeRefreshInterval}
                options={ACCELERATION_REFRESH_TIME_INTERVAL}
                onBlur={(e) => {
                  setAccelerationFormData(
                    producer((accData) => {
                      accData.formErrors.refreshIntervalError = validateRefreshInterval(
                        refreshTypeSelected,
                        refreshWindow,
                        e.target.value
                      );
                    })
                  );
                }}
              />
            }
          />
        </EuiFormRow>
      )}
      {refreshTypeSelected !== 'manual' && (
        <EuiFormRow
          label="Checkpoint location"
          helpText="The HDFS compatible file system location path for incremental refresh job checkpoint."
          isInvalid={hasError(accelerationFormData.formErrors, 'checkpointLocationError')}
          error={accelerationFormData.formErrors.checkpointLocationError}
          labelAppend={
            <EuiText size="xs">
              <EuiLink href={ACC_CHECKPOINT_DOCUMENTATION_URL} target="_blank">
                Learn more
              </EuiLink>
            </EuiText>
          }
        >
          <EuiFieldText
            placeholder="s3://checkpoint/location"
            value={checkpoint}
            onChange={onChangeCheckpoint}
            aria-label="Use aria labels when no actual label is in use"
            isInvalid={hasError(accelerationFormData.formErrors, 'checkpointLocationError')}
            onBlur={(e) => {
              setAccelerationFormData(
                producer((accData) => {
                  accData.formErrors.checkpointLocationError = validateCheckpointLocation(
                    accData.refreshType,
                    e.target.value
                  );
                })
              );
            }}
          />
        </EuiFormRow>
      )}
      {accelerationFormData.accelerationIndexType === 'materialized' && (
        <EuiFormRow
          label="Watermark Delay"
          helpText="Data arrival delay for incremental refresh on a materialized view with aggregations"
          isInvalid={hasError(accelerationFormData.formErrors, 'watermarkDelayError')}
          error={accelerationFormData.formErrors.watermarkDelayError}
        >
          <EuiFieldNumber
            placeholder="Watermark delay interval"
            value={delayWindow}
            onChange={onChangeDelayWindow}
            aria-label="Watermark delay interval"
            min={1}
            isInvalid={hasError(accelerationFormData.formErrors, 'watermarkDelayError')}
            onBlur={(e) => {
              setAccelerationFormData(
                producer((accData) => {
                  accData.formErrors.watermarkDelayError = validateWatermarkDelay(
                    accelerationFormData.accelerationIndexType,
                    parseInt(e.target.value, 10)
                  );
                })
              );
            }}
            append={
              <EuiSelect
                value={delayInterval}
                onChange={onChangeDelayInterval}
                options={ACCELERATION_TIME_INTERVAL}
              />
            }
          />
        </EuiFormRow>
      )}
    </>
  );
};
