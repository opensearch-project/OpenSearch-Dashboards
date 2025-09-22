/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Fragment } from 'react';
import { DurationFormat } from 'src/plugins/data/common';

import {
  EuiCompressedFieldNumber,
  EuiCompressedFormRow,
  EuiCompressedSelect,
  EuiCompressedSwitch,
} from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import {
  DefaultFormatEditor,
  defaultState,
  FormatEditorProps,
  FormatEditorState,
} from '../default';

import { FormatEditorSamples } from '../../samples';

interface DurationFormatEditorState {
  hasDecimalError: boolean;
}

interface InputFormat {
  kind: string;
  text: string;
}

interface OutputFormat {
  method: string;
  text: string;
}

interface DurationFormatEditorFormatParams {
  outputPrecision: number;
  inputFormat: string;
  outputFormat: string;
  showSuffix?: boolean;
}

export class DurationFormatEditor extends DefaultFormatEditor<
  DurationFormatEditorFormatParams,
  DurationFormatEditorState
> {
  static formatId = 'duration';
  state = {
    ...defaultState,
    sampleInputs: [-123, 1, 12, 123, 658, 1988, 3857, 123292, 923528271],
    hasDecimalError: false,
  };

  static getDerivedStateFromProps(
    nextProps: FormatEditorProps<DurationFormatEditorFormatParams>,
    state: FormatEditorState & DurationFormatEditorState
  ) {
    const output = super.getDerivedStateFromProps(nextProps, state);
    let error = null;

    if (
      !(nextProps.format as DurationFormat).isHuman() &&
      nextProps.formatParams.outputPrecision > 20
    ) {
      error = i18n.translate('datasetManagement.durationErrorMessage', {
        defaultMessage: 'Decimal places must be between 0 and 20',
      });
      nextProps.onError(error);
      return {
        ...output,
        error,
        hasDecimalError: true,
      };
    }

    return {
      ...output,
      hasDecimalError: false,
    };
  }

  render() {
    const { format, formatParams } = this.props;
    const { error, samples, hasDecimalError } = this.state;

    return (
      <Fragment>
        <EuiCompressedFormRow
          label={
            <FormattedMessage
              id="datasetManagement.duration.inputFormatLabel"
              defaultMessage="Input format"
            />
          }
          isInvalid={!!error}
          error={hasDecimalError ? null : error}
        >
          <EuiCompressedSelect
            value={formatParams.inputFormat}
            options={format.type.inputFormats.map((fmt: InputFormat) => {
              return {
                value: fmt.kind,
                text: fmt.text,
              };
            })}
            onChange={(e) => {
              this.onChange({ inputFormat: e.target.value });
            }}
            isInvalid={!!error}
          />
        </EuiCompressedFormRow>
        <EuiCompressedFormRow
          label={
            <FormattedMessage
              id="datasetManagement.duration.outputFormatLabel"
              defaultMessage="Output format"
            />
          }
          isInvalid={!!error}
        >
          <EuiCompressedSelect
            value={formatParams.outputFormat}
            options={format.type.outputFormats.map((fmt: OutputFormat) => {
              return {
                value: fmt.method,
                text: fmt.text,
              };
            })}
            onChange={(e) => {
              this.onChange({ outputFormat: e.target.value });
            }}
            isInvalid={!!error}
          />
        </EuiCompressedFormRow>
        {!(format as DurationFormat).isHuman() ? (
          <>
            <EuiCompressedFormRow
              label={
                <FormattedMessage
                  id="datasetManagement.duration.decimalPlacesLabel"
                  defaultMessage="Decimal places"
                />
              }
              isInvalid={!!error}
              error={hasDecimalError ? error : null}
            >
              <EuiCompressedFieldNumber
                value={formatParams.outputPrecision}
                min={0}
                max={20}
                onChange={(e) => {
                  this.onChange({
                    outputPrecision: e.target.value ? Number(e.target.value) : null,
                  });
                }}
                isInvalid={!!error}
              />
            </EuiCompressedFormRow>
            <EuiCompressedFormRow>
              <EuiCompressedSwitch
                label={
                  <FormattedMessage
                    id="datasetManagement.duration.showSuffixLabel"
                    defaultMessage="Show suffix"
                  />
                }
                checked={Boolean(formatParams.showSuffix)}
                onChange={(e) => {
                  this.onChange({ showSuffix: !formatParams.showSuffix });
                }}
              />
            </EuiCompressedFormRow>
          </>
        ) : null}
        <FormatEditorSamples samples={samples} />
      </Fragment>
    );
  }
}
