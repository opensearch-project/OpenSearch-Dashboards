/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { History } from 'history';

import { EuiButton } from '@elastic/eui';
import { CREATE_DATA_SOURCE_BUTTON_TEXT } from '../text_content';

interface Props {
  history: History;
}

export const CreateButton = ({ history }: Props) => {
  return (
    <EuiButton
      data-test-subj="createDataSourceButton"
      fill={true}
      onClick={() => history.push('/create')}
    >
      {CREATE_DATA_SOURCE_BUTTON_TEXT}
    </EuiButton>
  );
};
