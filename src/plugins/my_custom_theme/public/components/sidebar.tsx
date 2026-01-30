/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import styled from 'styled-components';
import { componentTokens, spacing } from '../theme/custom_theme';

const { sidebar: colors } = componentTokens;

export const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${spacing.s};
  width: 250px;
  background-color: ${colors.background};
  padding: ${spacing.m};
  min-height: 100vh;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
`;
