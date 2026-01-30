/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import styled from 'styled-components';
import { borderRadius, componentTokens, spacing, typography } from '../theme/custom_theme';

const { input: colors } = componentTokens;

export const Input = styled.input`
  background-color: ${colors.background};
  border: 1px solid ${colors.border};
  padding: ${spacing.s};
  font-family: ${typography.fontFamily};
  font-size: ${typography.fontSize.m};
  border-radius: ${borderRadius.s};
  width: 100%;
  box-sizing: border-box;

  &:focus-visible {
    outline: 2px solid ${colors.border};
    outline-offset: 2px;
  }
`;
