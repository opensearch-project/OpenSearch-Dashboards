/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { EuiBasicTable, EuiCode, EuiFlyout, EuiFlyoutBody, EuiText } from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

export const UrlTemplateFlyout = ({ isVisible = false, onClose = () => {} }) => {
  return isVisible ? (
    <EuiFlyout onClose={onClose}>
      <EuiFlyoutBody>
        <EuiText>
          <h3>
            <FormattedMessage
              id="datasetManagement.urlTemplateHeader"
              defaultMessage="Url Template"
            />
          </h3>
          <p>
            <FormattedMessage
              id="datasetManagement.urlTemplateLabel.fieldDetail"
              defaultMessage="If a field only contains part of a URL then a {strongUrlTemplate} can be used to format the value as
              a complete URL. The format is a string which uses double curly brace notation {doubleCurlyBraces} to inject values.
              The following values can be accessed:"
              values={{
                doubleCurlyBraces: <EuiCode>{'{{ }}'}</EuiCode>,
                strongUrlTemplate: (
                  <strong>
                    <FormattedMessage
                      id="datasetManagement.urlTemplateLabel.strongUrlTemplateLabel"
                      defaultMessage="Url Template"
                    />
                  </strong>
                ),
              }}
            />
          </p>
          <ul>
            <li>
              <EuiCode>value</EuiCode> &mdash;&nbsp;
              <FormattedMessage
                id="datasetManagement.urlTemplate.valueLabel"
                defaultMessage="The URI-escaped value"
              />
            </li>
            <li>
              <EuiCode>rawValue</EuiCode> &mdash;&nbsp;
              <FormattedMessage
                id="datasetManagement.urlTemplate.rawValueLabel"
                defaultMessage="The unescaped value"
              />
            </li>
          </ul>
          <h4>
            <FormattedMessage
              id="datasetManagement.urlTemplate.examplesHeader"
              defaultMessage="Examples"
            />
          </h4>
          <EuiBasicTable
            items={[
              {
                input: 1234,
                template: 'http://company.net/profiles?user_id={{value}}',
                output: 'http://company.net/profiles?user_id=1234',
              },
              {
                input: 'users/admin',
                template: 'http://company.net/groups?id={{value}}',
                output: 'http://company.net/groups?id=users%2Fadmin',
              },
              {
                input: '/images/favicon.ico',
                template: 'http://www.site.com{{rawValue}}',
                output: 'http://www.site.com/images/favicon.ico',
              },
            ]}
            columns={[
              {
                field: 'input',
                name: i18n.translate('datasetManagement.urlTemplate.inputHeader', {
                  defaultMessage: 'Input',
                }),
                width: '160px',
              },
              {
                field: 'template',
                name: i18n.translate('datasetManagement.urlTemplate.templateHeader', {
                  defaultMessage: 'Template',
                }),
              },
              {
                field: 'output',
                name: i18n.translate('datasetManagement.urlTemplate.outputHeader', {
                  defaultMessage: 'Output',
                }),
              },
            ]}
          />
        </EuiText>
      </EuiFlyoutBody>
    </EuiFlyout>
  ) : null;
};
