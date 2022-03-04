/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ComponentType } from 'react';
import { Select, TextInput, ITEM_TYPES } from '../../common/items';
import { FieldContributions } from './types';
import { useFormField } from './use';

const mapItemToFormFieldComponent: { [key in ITEM_TYPES]: ComponentType<any> } = {
  [ITEM_TYPES.SELECT]: Select,
  [ITEM_TYPES.INPUT]: TextInput,
};

export const FormField = ({ type, id, onChange, ...props }: FieldContributions) => {
  const FieldComponent = mapItemToFormFieldComponent[type];
  const hookProps = useFormField(id, onChange);

  return <FieldComponent {...props} {...hookProps} />;
};
