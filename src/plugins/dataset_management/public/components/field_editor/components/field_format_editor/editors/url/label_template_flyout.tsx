/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { EuiBasicTable, EuiCode, EuiFlyout, EuiFlyoutBody, EuiText } from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

interface LabelTemplateExampleItem {
  input: string | number;
  urlTemplate: string;
  labelTemplate: string;
  output: string;
}

const items: LabelTemplateExampleItem[] = [
  {
    input: 1234,
    urlTemplate: 'http://company.net/profiles?user_id={{value}}',
    labelTemplate: i18n.translate('datasetManagement.labelTemplate.example.idLabel', {
      defaultMessage: 'User #{value}',
      values: { value: '{{value}}' },
    }),
    output:
      '<a href="http://company.net/profiles?user_id=1234">' +
      i18n.translate('datasetManagement.labelTemplate.example.output.idLabel', {
        defaultMessage: 'User',
      }) +
      ' #1234</a>',
  },
  {
    input: '/assets/main.css',
    urlTemplate: 'http://site.com{{rawValue}}',
    labelTemplate: i18n.translate('datasetManagement.labelTemplate.example.pathLabel', {
      defaultMessage: 'View Asset',
    }),
    output:
      '<a href="http://site.com/assets/main.css">' +
      i18n.translate('datasetManagement.labelTemplate.example.output.pathLabel', {
        defaultMessage: 'View Asset',
      }) +
      '</a>',
  },
];

export const LabelTemplateFlyout = ({ isVisible = false, onClose = () => {} }) => {
  return isVisible ? (
    <EuiFlyout onClose={onClose}>
      <EuiFlyoutBody>
        <EuiText>
          <h3>
            <FormattedMessage
              id="datasetManagement.labelTemplateHeader"
              defaultMessage="Label Template"
            />
          </h3>
          <p>
            <FormattedMessage
              id="datasetManagement.labelTemplateLabel"
              defaultMessage="If the URL in this field is large, it might be useful to provide an alternate template for the text version
              of the URL. This will be displayed instead of the url, but will still link to the URL. The format is a string which uses
              double curly brace notation {doubleCurlyBraces} to inject values. The following values can be accessed:"
              values={{ doubleCurlyBraces: <EuiCode>{'{{ }}'}</EuiCode> }}
            />
          </p>
          <ul>
            <li>
              <EuiCode>value</EuiCode> &mdash;&nbsp;
              <FormattedMessage
                id="datasetManagement.labelTemplate.valueLabel"
                defaultMessage="The fields value"
              />
            </li>
            <li>
              <EuiCode>url</EuiCode> &mdash;&nbsp;
              <FormattedMessage
                id="datasetManagement.labelTemplate.urlLabel"
                defaultMessage="The formatted URL"
              />
            </li>
          </ul>
          <h4>
            <FormattedMessage
              id="datasetManagement.labelTemplate.examplesHeader"
              defaultMessage="Examples"
            />
          </h4>
          <EuiBasicTable<LabelTemplateExampleItem>
            items={items}
            columns={[
              {
                field: 'input',
                name: i18n.translate('datasetManagement.labelTemplate.inputHeader', {
                  defaultMessage: 'Input',
                }),
                width: '160px',
              },
              {
                field: 'urlTemplate',
                name: i18n.translate('datasetManagement.labelTemplate.urlHeader', {
                  defaultMessage: 'URL Template',
                }),
              },
              {
                field: 'labelTemplate',
                name: i18n.translate('datasetManagement.labelTemplate.labelHeader', {
                  defaultMessage: 'Label Template',
                }),
              },
              {
                field: 'output',
                name: i18n.translate('datasetManagement.labelTemplate.outputHeader', {
                  defaultMessage: 'Output',
                }),
                render: (value: LabelTemplateExampleItem['output']) => {
                  return (
                    <span
                      /*
                       * Justification for dangerouslySetInnerHTML:
                       * Example output produces anchor link.
                       */
                      dangerouslySetInnerHTML={{ __html: value }} // eslint-disable-line react/no-danger
                    />
                  );
                },
              },
            ]}
          />
        </EuiText>
      </EuiFlyoutBody>
    </EuiFlyout>
  ) : null;
};

LabelTemplateFlyout.displayName = 'LabelTemplateFlyout';
