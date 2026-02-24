/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { DescriptionProps } from './types';

export const Description = (props: DescriptionProps) => (
  <div className={props.className}>
    <div className="osd:text-xs osd:text-body-default">{props.label}</div>
    <div className="osd:text-xs osd:text-body-secondary">{props.value} </div>
  </div>
);
