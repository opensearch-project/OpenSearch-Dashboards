/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import styled from 'styled-components';
import { borderRadius, colors, spacing, typography } from '../theme/custom_theme';

export const Button = styled.button`
  background-color: ${colors.button.background.idle};
  color: ${colors.button.text.idle};
  padding: ${spacing.s} ${spacing.l};
  font-family: ${typography.fontFamily};
  border-radius: ${borderRadius.s};
  border: none;
  cursor: pointer;

  &:hover {
    background-color: ${colors.button.background.hover};
    color: ${colors.button.text.hover};
  }
`;
