/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FieldSelector } from '../../components/field_selector';
import { ViewProps } from '../../../../../data_explorer/public';
import './panel.scss';

// eslint-disable-next-line import/no-default-export
export default function VisBuilderPanel(props: ViewProps) {
  return (
    <div className="vbFieldSelector">
      <FieldSelector />
    </div>
  );
}
