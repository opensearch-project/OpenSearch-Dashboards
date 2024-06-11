/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
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

import React, { useState } from 'react';
import {
  EuiPopover,
  EuiPopoverTitle,
  EuiButtonIcon,
  EuiToolTip,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DiscoverFieldDetails } from './discover_field_details';
import { FieldIcon } from '../../../../../opensearch_dashboards_react/public';
import { FieldDetails } from './types';
import { IndexPatternField, IndexPattern } from '../../../../../data/public';
import { shortenDottedString } from '../../helpers';
import { getFieldTypeName } from './lib/get_field_type_name';
import './discover_field.scss';

export interface DiscoverFieldProps {
  /**
   * the selected columns displayed in the doc table in discover
   */
  columns: string[];
  /**
   * The displayed field
   */
  field: IndexPatternField;
  /**
   * The currently selected index pattern
   */
  indexPattern: IndexPattern;
  /**
   * Callback to add/select the field
   */
  onAddField: (fieldName: string) => void;
  /**
   * Callback to add a filter to filter bar
   */
  onAddFilter: (field: IndexPatternField | string, value: string, type: '+' | '-') => void;
  /**
   * Callback to remove/deselect a the field
   * @param fieldName
   */
  onRemoveField: (fieldName: string) => void;
  /**
   * Retrieve details data for the field
   */
  getDetails: (field: IndexPatternField) => FieldDetails;
  /**
   * Determines whether the field is selected
   */
  selected?: boolean;
  /**
   * Determines whether the field name is shortened test.sub1.sub2 = t.s.sub2
   */
  useShortDots?: boolean;
}

export const DiscoverField = ({
  field,
  selected,
  onAddField,
  onRemoveField,
  columns,
  indexPattern,
  onAddFilter,
  getDetails,
  useShortDots,
}: DiscoverFieldProps) => {
  const addLabelAria = i18n.translate('discover.fieldChooser.discoverField.addButtonAriaLabel', {
    defaultMessage: 'Add {field} to table',
    values: { field: field.name },
  });
  const removeLabelAria = i18n.translate(
    'discover.fieldChooser.discoverField.removeButtonAriaLabel',
    {
      defaultMessage: 'Remove {field} from table',
      values: { field: field.name },
    }
  );
  const infoLabelAria = i18n.translate('discover.fieldChooser.discoverField.infoButtonAriaLabel', {
    defaultMessage: 'View {field} summary',
    values: { field: field.name },
  });
  const isSourceField = field.name === '_source';

  const [infoIsOpen, setOpen] = useState(false);

  const toggleDisplay = (f: IndexPatternField) => {
    if (selected) {
      onRemoveField(f.name);
    } else {
      onAddField(f.name);
    }
  };

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
      className="dscSidebarField__name eui-textBreakWord"
    >
      {useShortDots ? wrapOnDot(shortenDottedString(field.name)) : wrapOnDot(field.displayName)}
    </span>
  );

  let actionButton;
  if (!isSourceField && !selected) {
    actionButton = (
      <EuiToolTip
        delay="long"
        content={i18n.translate('discover.fieldChooser.discoverField.addFieldTooltip', {
          defaultMessage: 'Add field as column',
        })}
      >
        <EuiButtonIcon
          iconType="plusInCircleFilled"
          onClick={(ev: React.MouseEvent<HTMLButtonElement>) => {
            if (ev.type === 'click') {
              ev.currentTarget.focus();
            }
            ev.preventDefault();
            ev.stopPropagation();
            toggleDisplay(field);
          }}
          data-test-subj={`fieldToggle-${field.name}`}
          aria-label={addLabelAria}
          className="dscSidebarField__actionButton"
        />
      </EuiToolTip>
    );
  } else if (!isSourceField && selected) {
    actionButton = (
      <EuiToolTip
        delay="long"
        content={i18n.translate('discover.fieldChooser.discoverField.removeFieldTooltip', {
          defaultMessage: 'Remove field from table',
        })}
      >
        <EuiButtonIcon
          color="danger"
          iconType="cross"
          onClick={(ev: React.MouseEvent<HTMLButtonElement>) => {
            if (ev.type === 'click') {
              ev.currentTarget.focus();
            }
            ev.preventDefault();
            ev.stopPropagation();
            toggleDisplay(field);
          }}
          data-test-subj={`fieldToggle-${field.name}`}
          aria-label={removeLabelAria}
          className="dscSidebarField__actionButton"
        />
      </EuiToolTip>
    );
  }

  return (
    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} className="dscSidebarField">
      <EuiFlexItem grow={false}>
        <FieldIcon
          type={field.type}
          label={getFieldTypeName(field.type)}
          scripted={field.scripted}
        />
      </EuiFlexItem>
      <EuiFlexItem grow>
        <EuiText size="xs">{fieldName}</EuiText>
      </EuiFlexItem>
      {!isSourceField && (
        <EuiFlexItem grow={false}>
          <EuiPopover
            ownFocus
            display="block"
            isOpen={infoIsOpen}
            closePopover={() => setOpen(false)}
            anchorPosition="rightUp"
            button={
              <EuiButtonIcon
                iconType="inspect"
                size="xs"
                onClick={() => setOpen((state) => !state)}
                aria-label={infoLabelAria}
                data-test-subj={`field-${field.name}-showDetails`}
                className="dscSidebarField__actionButton"
              />
            }
            panelClassName="dscSidebarItem__fieldPopoverPanel"
          >
            <EuiPopoverTitle>
              {' '}
              {i18n.translate('discover.fieldChooser.discoverField.fieldTopValuesLabel', {
                defaultMessage: 'Top 5 values',
              })}
            </EuiPopoverTitle>
            {infoIsOpen && (
              <DiscoverFieldDetails
                columns={columns}
                details={getDetails(field)}
                field={field}
                indexPattern={indexPattern}
                onAddFilter={onAddFilter}
              />
            )}
          </EuiPopover>
        </EuiFlexItem>
      )}
      {!isSourceField && <EuiFlexItem grow={false}>{actionButton}</EuiFlexItem>}
    </EuiFlexGroup>
  );
};
