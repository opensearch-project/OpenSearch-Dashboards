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

interface DateNanosFormatEditorFormatParams {
  pattern: string;
}

export class DateNanosFormatEditor extends DefaultFormatEditor<DateNanosFormatEditorFormatParams> {
  static formatId = 'date_nanos';
  state = {
    ...defaultState,
    sampleInputs: [
      '2015-01-01T12:10:30.123456789Z',
      '2019-05-08T06:55:21.567891234Z',
      '2019-08-06T17:22:30.987654321Z',
    ],
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
              id="datasetManagement.date.momentLabel"
              defaultMessage="Moment.js format pattern (Default: {defaultPattern})"
              values={{
                defaultPattern: <EuiCode>{defaultPattern}</EuiCode>,
              }}
            />
          }
          isInvalid={!!error}
          error={error}
          helpText={
            <span>
              <EuiLink target="_blank" href="https://momentjs.com/">
                <FormattedMessage
                  id="datasetManagement.date.documentationLabel"
                  defaultMessage="Documentation"
                />
                &nbsp;
                <EuiIcon type="link" />
              </EuiLink>
            </span>
          }
        >
          <EuiCompressedFieldText
            data-test-subj="dateEditorPattern"
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
