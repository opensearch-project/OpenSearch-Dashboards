/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import produce from 'immer';
import { useCallback, useMemo } from 'react';
import {
  ConfigState,
  updateConfigItemState,
  updateInstance,
} from '../../../../../utils/state_management/config_slice';
import { useTypedSelector, useTypedDispatch } from '../../../../../utils/state_management';
import { FieldContributions } from '../types';

export const INDEX_FIELD_KEY = 'fieldName';

interface FieldProps {
  onChange: Function;
  value: string;
}

export const useFormField = (id: string, onChange: FieldContributions['onChange']): FieldProps => {
  const configState = useTypedSelector((state) => state.config);
  const { activeItem, items } = configState;
  const dispatch = useTypedDispatch();

  const instanceState = useMemo(() => getInstanceState(configState) ?? {}, [configState]);

  const handleChange = useCallback(
    (newValue: string) => {
      onChange?.(newValue);

      // is a MainPanel field value
      if (!activeItem) {
        dispatch(
          updateConfigItemState({
            id,
            itemState: newValue,
          })
        );
        return;
      }

      const newInstanceState = produce(instanceState, (draftState) => {
        draftState[id] = newValue;
      });

      dispatch(
        updateInstance({
          id: activeItem.id,
          instanceId: activeItem.instanceId,
          instanceState: newInstanceState,
        })
      );
    },
    [activeItem, dispatch, id, instanceState, onChange]
  );

  return {
    value: activeItem ? instanceState[id] : items[id],
    onChange: handleChange,
  };
};

function getInstanceState({ items, activeItem }: ConfigState) {
  const { id: parentItemId, instanceId } = activeItem ?? {};
  const configItem = items[parentItemId ?? ''];

  if (!configItem || typeof configItem === 'string') return;

  const instanceItem = configItem.instances.find(({ id }) => id === instanceId);

  if (!instanceItem) return;

  return instanceItem.properties;
}
