/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Fragment } from 'react';

import {
  EuiCode,
  EuiCompressedFieldText,
  EuiCompressedFormRow,
  EuiIcon,
  EuiLink,
} from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { DefaultFormatEditor, defaultState } from '../default';

import { FormatEditorSamples } from '../../samples';

export interface NumberFormatEditorParams {
  pattern: string;
}

export class NumberFormatEditor extends DefaultFormatEditor<NumberFormatEditorParams> {
  static formatId = 'number';
  state = {
    ...defaultState,
    sampleInputs: [10000, 12.345678, -1, -999, 0.52],
  };

  render() {
    const { format, formatParams } = this.props;
    const { error, samples } = this.state;
    const defaultPattern = format.getParamDefaults().pattern;

    return (
      <Fragment>
        <EuiCompressedFormRow
          label={
            <FormattedMessage
              id="datasetManagement.number.numeralLabel"
              defaultMessage="Numeral.js format pattern (Default: {defaultPattern})"
              values={{ defaultPattern: <EuiCode>{defaultPattern}</EuiCode> }}
            />
          }
          helpText={
            <span>
              <EuiLink target="_blank" href="https://adamwdraper.github.io/Numeral-js/">
                <FormattedMessage
                  id="datasetManagement.number.documentationLabel"
                  defaultMessage="Documentation"
                />
                &nbsp;
                <EuiIcon type="link" />
              </EuiLink>
            </span>
          }
          isInvalid={!!error}
          error={error}
        >
          <EuiCompressedFieldText
            value={formatParams.pattern}
            placeholder={defaultPattern}
            onChange={(e) => {
              this.onChange({ pattern: e.target.value });
            }}
            isInvalid={!!error}
          />
        </EuiCompressedFormRow>
        <FormatEditorSamples samples={samples} />
      </Fragment>
    );
  }
}
