/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { set } from 'lodash';
import produce from 'immer';
import { useState, useCallback } from 'react';
import { updateConfigItemState } from '../../../../../utils/state_management/config_slice';
import { useTypedSelector, useTypedDispatch } from '../../../../../utils/state_management';
import { DropBoxState, INITIAL_STATE as INITIAL_DROPBOX_STATE } from './use_dropbox';
import { FieldContributions } from '../types';

interface FieldProps {
  onChange: Function;
  value: string;
}

export const useFormField = (id: string, onChange: FieldContributions['onChange']): FieldProps => {
  const activeDropbox = useTypedSelector((state) => state.config.activeItem);
  const { items } = useTypedSelector((state) => state.config);
  const dropBoxState: DropBoxState =
    activeDropbox?.id && items[activeDropbox.id] ? items[activeDropbox.id] : INITIAL_DROPBOX_STATE;
  const dispatch = useTypedDispatch();
  const [value, setValue] = useState<any>();

  const handleChange = useCallback(
    (newValue: string) => {
      onChange?.(newValue);

      if (!activeDropbox) {
        setValue(newValue);
        return;
      }

      const newDropboxState = produce(dropBoxState, (draftState) => {
        // For new fields
        if (!activeDropbox.fieldName) {
          set(draftState, `draft.${id}`, newValue);
        } else {
          draftState.fields[activeDropbox.fieldName][id] = newValue;
        }
      });

      dispatch(
        updateConfigItemState({
          id: activeDropbox.id,
          itemState: newDropboxState,
        })
      );
    },
    [activeDropbox, dispatch, dropBoxState, id, onChange]
  );

  const formFieldValue = activeDropbox
    ? activeDropbox.fieldName
      ? dropBoxState.fields[activeDropbox.fieldName][id]
      : dropBoxState.draft?.[id]
    : value;

  return {
    value: formFieldValue,
    onChange: handleChange,
  };
};
