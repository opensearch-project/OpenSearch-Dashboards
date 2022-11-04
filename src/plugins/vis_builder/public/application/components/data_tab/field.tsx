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
import { EuiPopover } from '@elastic/eui';

import { IndexPatternField } from '../../../../../data/public';
import {
  FieldButton,
  FieldButtonProps,
  FieldIcon,
} from '../../../../../opensearch_dashboards_react/public';

import { COUNT_FIELD, useDrag } from '../../utils/drag_drop';
import { FieldDetailsView } from './field_details';
import { FieldDetails } from './types';
import './field.scss';

export interface FieldProps {
  field: IndexPatternField;
  getDetails: (field) => FieldDetails;
}

// TODO: Add field sections (Available fields, popular fields from src/plugins/discover/public/application/components/sidebar/discover_sidebar.tsx)
export const Field = ({ field, getDetails }: FieldProps) => {
  const [infoIsOpen, setOpen] = useState(false);

  function togglePopover() {
    setOpen(!infoIsOpen);
  }

  return (
    <EuiPopover
      ownFocus
      display="block"
      button={<DraggableFieldButton isActive={infoIsOpen} onClick={togglePopover} field={field} />}
      isOpen={infoIsOpen}
      closePopover={() => setOpen(false)}
      anchorPosition="rightUp"
      panelClassName="vbItem__fieldPopoverPanel"
      // TODO: make reposition on scroll actually work: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2782
      repositionOnScroll
      data-test-subj="field-popover"
    >
      {infoIsOpen && <FieldDetailsView field={field} details={getDetails(field)} />}
    </EuiPopover>
  );
};

export interface DraggableFieldButtonProps extends Partial<FieldButtonProps> {
  dragValue?: IndexPatternField['name'] | null | typeof COUNT_FIELD;
  field: Partial<IndexPatternField> & Pick<IndexPatternField, 'displayName' | 'name' | 'type'>;
}

export const DraggableFieldButton = ({ dragValue, field, ...rest }: DraggableFieldButtonProps) => {
  const { name, displayName, type, scripted = false } = field;
  const [dragProps] = useDrag({
    namespace: 'field-data',
    value: dragValue ?? name,
  });

  function wrapOnDot(str: string) {
    // u200B is a non-width white-space character, which allows
    // the browser to efficiently word-wrap right after the dot
    // without us having to draw a lot of extra DOM elements, etc
    return str.replace(/\./g, '.\u200B');
  }

  const defaultIcon = <FieldIcon type={type} scripted={scripted} size="l" />;

  const defaultFieldName = (
    <span data-test-subj={`field-${name}`} title={name} className="vbFieldButton__name">
      {wrapOnDot(displayName)}
    </span>
  );

  const defaultProps = {
    className: 'vbFieldButton',
    dataTestSubj: `field-${name}-showDetails`,
    fieldIcon: defaultIcon,
    fieldName: defaultFieldName,
    onClick: () => {},
  };

  return <FieldButton {...defaultProps} {...rest} {...dragProps} />;
};
