/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiHeader, EuiHeaderProps } from '@elastic/eui';
import React from 'react';
import styled from 'styled-components';
import { ChromeBranding } from '../../../chrome_service';

interface StyledHeaderProps {
  $branding: ChromeBranding;
}

export type CustomHeaderProps = EuiHeaderProps & {
  branding: ChromeBranding;
};

const StyledHeader = styled(EuiHeader)<StyledHeaderProps>`
  background-color: ${(props) => props.$branding.colors?.headerBackgroundColor};
  border-bottom-color: ${(props) => props.$branding.colors?.headerBackgroundColor};
  .euiHeaderLink,
  .euiHeaderSectionItemButton {
    color: ${(props) => props.$branding.colors?.headerLinkColor};
  }
`;

export const CustomHeader = (props: CustomHeaderProps) => {
  const { branding, ...rest } = props;

  return <StyledHeader $branding={branding} {...rest} />;
};
