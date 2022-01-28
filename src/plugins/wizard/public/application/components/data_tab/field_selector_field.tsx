/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { useState } from 'react';
import { EuiPopover, EuiPopoverTitle } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { IndexPattern } from 'src/plugins/data/common';
import { IndexPatternField } from 'src/plugins/data/public';
import { FieldButton, FieldIcon } from '../../../../../opensearch_dashboards_react/public';
import { FieldDetails } from './types';
import { useDrag } from '../../utils/drag_drop';

import './field_selector_field.scss';
import { WizardFieldDetails } from './field_details';

export interface FieldSelectorFieldProps {
  field: IndexPatternField;
  indexPattern: IndexPattern | null;
  getDetails: (field: IndexPatternField) => FieldDetails;
}

// TODO:
// 1. Add field sections (Available fields, popular fields from src/plugins/discover/public/application/components/sidebar/discover_sidebar.tsx)
// 2. Add popover for fields stats from discover as well
export const FieldSelectorField = ({
  field,
  indexPattern,
  getDetails,
}: FieldSelectorFieldProps) => {
  const [infoIsOpen, setOpen] = useState(false);
  const [dragProps] = useDrag(field, `dataPlane`);

  function togglePopover() {
    setOpen(!infoIsOpen);
  }

  function wrapOnDot(str?: string) {
    // u200B is a non-width white-space character, which allows
    // the browser to efficiently word-wrap right after the dot
    // without us having to draw a lot of extra DOM elements, etc
    return str ? str.replace(/\./g, '.\u200B') : '';
  }

  const fieldName = (
    <span
      data-test-subj={`field-${field.name}`}
      title={field.name}
      className="wizFieldSelectorField__name"
    >
      {wrapOnDot(field.displayName)}
    </span>
  );

  return (
    <EuiPopover
      ownFocus
      display="block"
      button={
        <FieldButton
          size="s"
          className="wizFieldSelectorField"
          isActive={infoIsOpen}
          onClick={togglePopover}
          dataTestSubj={`field-${field.name}-showDetails`}
          fieldIcon={<FieldIcon type={field.type} scripted={field.scripted} />}
          // fieldAction={actionButton}
          fieldName={fieldName}
          {...dragProps}
        />
      }
      isOpen={infoIsOpen}
      closePopover={() => setOpen(false)}
      anchorPosition="rightUp"
      panelClassName="wizardItem__fieldPopoverPanel"
    >
      <EuiPopoverTitle>
        {' '}
        {i18n.translate('wizard.fieldChooser.wizardField.fieldTopValuesLabel', {
          defaultMessage: 'Top 5 values',
        })}
      </EuiPopoverTitle>
      {infoIsOpen && (
        <WizardFieldDetails field={field} indexPattern={indexPattern} details={getDetails(field)} />
      )}
    </EuiPopover>
  );
};
