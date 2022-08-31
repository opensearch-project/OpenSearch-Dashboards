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
import { IndexPatternField } from '../../../../../data/public';
import { FieldButton, FieldIcon } from '../../../../../opensearch_dashboards_react/public';
import { useDrag } from '../../utils/drag_drop/drag_drop_context';
import { COUNT_FIELD } from '../../utils/drag_drop/types';

import './field_selector_field.scss';

export interface FieldSelectorFieldProps {
  field: Partial<IndexPatternField> & Pick<IndexPatternField, 'displayName' | 'type' | 'scripted'>;
}

// TODO:
// 1. Add field sections (Available fields, popular fields from src/plugins/discover/public/application/components/sidebar/discover_sidebar.tsx)
// 2. Add popover for fields stats from discover as well
export const FieldSelectorField = ({ field }: FieldSelectorFieldProps) => {
  const [infoIsOpen, setOpen] = useState(false);
  const [dragProps] = useDrag({
    namespace: 'field-data',
    value: field.name || COUNT_FIELD,
  });

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
    <FieldButton
      className="wizFieldSelectorField"
      isActive={infoIsOpen}
      onClick={togglePopover}
      dataTestSubj={`field-${field.name}-showDetails`}
      fieldIcon={<FieldIcon type={field.type} scripted={field.scripted} size="l" />}
      // fieldAction={actionButton}
      fieldName={fieldName}
      {...dragProps}
    />
  );
};
