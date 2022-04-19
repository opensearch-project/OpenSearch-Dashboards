/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiHeader, EuiHeaderProps } from '@elastic/eui';
import React from 'react';
import styled from 'styled-components';
import { ChromeBranding } from '../../../chrome_service';

interface StyledHeaderProps {
  $backgroundColor: string | undefined;
  $borderColor: string | undefined;
  $linkColor: string | undefined;
}

export type CustomHeaderProps = EuiHeaderProps & {
  branding: ChromeBranding;
};

const StyledHeader = styled(EuiHeader)<StyledHeaderProps>`
  background-color: ${(props) => props.$backgroundColor};
  border-bottom-color: ${(props) => props.$borderColor};
  .euiHeaderLink,
  .euiHeaderSectionItemButton {
    color: ${(props) => props.$linkColor};
  }
`;

export const CustomHeader = (props: CustomHeaderProps) => {
  const { branding, ...rest } = props;
  const darkMode = branding.darkMode;
  const backgroundDefault = branding.colors?.headerBackground?.defaultColor;
  const backgroundDarkMode = branding.colors?.headerBackground?.darkModeColor;
  const linkDefault = branding.colors?.headerLink?.defaultColor;
  const linkDarkMode = branding.colors?.headerLink?.darkModeColor;
  const borderDefault = branding.colors?.headerBorder?.defaultColor;
  const borderDarkMode = branding.colors?.headerBorder?.darkModeColor;

  const theme = () => {
    return darkMode ? 'dark' : 'default';
  };

  const backgroundColor = () => {
    return darkMode ? backgroundDarkMode ?? backgroundDefault : backgroundDefault;
  };

  const linkColor = () => {
    return darkMode ? linkDarkMode ?? linkDefault : linkDefault;
  };

  const borderColor = () => {
    return darkMode ? borderDarkMode ?? borderDefault : borderDefault;
  };

  return (
    <StyledHeader
      $backgroundColor={backgroundColor()}
      $linkColor={linkColor()}
      $borderColor={borderColor()}
      theme={theme()}
      {...rest}
    />
  );
};
