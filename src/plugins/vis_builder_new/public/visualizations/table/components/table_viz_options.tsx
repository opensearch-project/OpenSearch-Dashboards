/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import produce from 'immer';
import { Draft } from 'immer';
import { EuiIconTip } from '@elastic/eui';
import { NumberInputOption, SwitchOption } from '../../../../../charts/public';
import {
  useTypedDispatch,
  useTypedSelector,
  setStyleState,
} from '../../../application/utils/state_management';
import { TableOptionsDefaults } from '../table_viz_type';
import { Option } from '../../../application/app';

function TableVizOptions() {
  const styleState = useTypedSelector((state) => state.style) as TableOptionsDefaults;
  const dispatch = useTypedDispatch();

  const setOption = useCallback(
    (callback: (draft: Draft<typeof styleState>) => void) => {
      const newState = produce(styleState, callback);
      dispatch(setStyleState<TableOptionsDefaults>(newState));
    },
    [dispatch, styleState]
  );

  const isPerPageValid = styleState.perPage === '' || styleState.perPage > 0;

  return (
    <>
      <Option
        title={i18n.translate('visTypeTableNewNew.params.settingsTitle', {
          defaultMessage: 'Settings',
        })}
        initialIsOpen
      >
        <NumberInputOption
          label={
            <>
              {i18n.translate('visTypeTableNewNew.params.perPageLabel', {
                defaultMessage: 'Max rows per page',
              })}
              <EuiIconTip
                content={
                  <FormattedMessage
                    id="visTypeTableNewNews.field.emptyTooltip"
                    defaultMessage="Leaving this field empty means it will use number of buckets from the response."
                  />
                }
                position="right"
              />
            </>
          }
          isInvalid={!isPerPageValid}
          min={1}
          paramName="perPage"
          value={styleState.perPage}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.perPage = value;
            })
          }
        />

        <SwitchOption
          label={i18n.translate('visTypeTableNewNew.params.showMetricsLabel', {
            defaultMessage: 'Show metrics for every bucket/level',
          })}
          paramName="showMetricsAtAllLevels"
          value={styleState.showMetricsAtAllLevels}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.showMetricsAtAllLevels = value;
            })
          }
          data-test-subj="showMetricsAtAllLevels"
        />

        <SwitchOption
          label={i18n.translate('visTypeTableNewNew.params.showPartialRowsLabel', {
            defaultMessage: 'Show partial rows',
          })}
          tooltip={i18n.translate('visTypeTableNewNew.params.showPartialRowsTip', {
            defaultMessage:
              'Show rows that have partial data. This will still calculate metrics for every bucket/level, even if they are not displayed.',
          })}
          paramName="showPartialRows"
          value={styleState.showPartialRows}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.showPartialRows = value;
            })
          }
          data-test-subj="showPartialRows"
        />
      </Option>
    </>
  );
}

export { TableVizOptions };
