/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import styled from 'styled-components';
import { borderRadius, colors, spacing, typography } from '../theme/custom_theme';

export const Input = styled.input`
  background-color: ${colors.input.background};
  border: 1px solid ${colors.input.border};
  padding: ${spacing.s};
  font-family: ${typography.fontFamily};
  font-size: ${typography.fontSize};
  border-radius: ${borderRadius.s};
  width: 100%;
  box-sizing: border-box;
`;
