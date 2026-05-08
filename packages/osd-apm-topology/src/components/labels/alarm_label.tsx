/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { SliStatusIcon } from '../sli_status_icon';
import { Label } from './label';
import type { LabelProps } from './types';

export const AlarmLabel = ({
  text,
  children = <SliStatusIcon status="breached" size={22} />,
}: LabelProps) => <Label text={text}>{children}</Label>;
