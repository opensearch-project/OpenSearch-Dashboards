/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import produce from 'immer';
import { Draft } from 'immer';
import { EuiIconTip } from '@elastic/eui';
import { search } from '../../../../../data/public';
import { NumberInputOption, SwitchOption, SelectOption } from '../../../../../charts/public';
import {
  useTypedDispatch,
  useTypedSelector,
  setStyleState,
} from '../../../application/utils/state_management';
import { useAggs } from '../../../../public/application/utils/use';
import { TableOptionsDefaults } from '../table_viz_type';
import { Option } from '../../../application/app';
import { AggTypes } from '../types';

const { tabifyGetColumns } = search;

const totalAggregations = [
  {
    value: AggTypes.SUM,
    text: i18n.translate('visTypeTableNew.totalAggregations.sumText', {
      defaultMessage: 'Sum',
    }),
  },
  {
    value: AggTypes.AVG,
    text: i18n.translate('visTypeTableNew.totalAggregations.averageText', {
      defaultMessage: 'Average',
    }),
  },
  {
    value: AggTypes.MIN,
    text: i18n.translate('visTypeTableNewNew.totalAggregations.minText', {
      defaultMessage: 'Min',
    }),
  },
  {
    value: AggTypes.MAX,
    text: i18n.translate('visTypeTableNewNew.totalAggregations.maxText', {
      defaultMessage: 'Max',
    }),
  },
  {
    value: AggTypes.COUNT,
    text: i18n.translate('visTypeTableNewNew.totalAggregations.countText', {
      defaultMessage: 'Count',
    }),
  },
];

function TableVizOptions() {
  const styleState = useTypedSelector((state) => state.style) as TableOptionsDefaults;
  const { aggConfigs } = useAggs();
  const dispatch = useTypedDispatch();

  const setOption = useCallback(
    (callback: (draft: Draft<typeof styleState>) => void) => {
      const newState = produce(styleState, callback);
      dispatch(setStyleState<TableOptionsDefaults>(newState));
    },
    [dispatch, styleState]
  );

  const percentageColumns = useMemo(() => {
    const defaultPercentageColText = {
      value: '',
      text: i18n.translate('visTypeTableNew.params.defaultPercentageCol', {
        defaultMessage: 'Don’t show',
      }),
    };
    return aggConfigs
      ? [
          defaultPercentageColText,
          ...tabifyGetColumns(aggConfigs.getResponseAggs(), true)
            .filter((col) => get(col.aggConfig.toSerializedFieldFormat(), 'id') === 'number')
            .map(({ name }) => ({ value: name, text: name })),
        ]
      : [defaultPercentageColText];
  }, [aggConfigs]);

  useEffect(() => {
    if (
      !percentageColumns.find(({ value }) => value === styleState.percentageCol) &&
      percentageColumns[0] &&
      percentageColumns[0].value !== styleState.percentageCol
    ) {
      setOption((draft) => {
        draft.percentageCol = percentageColumns[0].value;
      });
    }
  }, [percentageColumns, styleState.percentageCol, setOption]);

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

        <SwitchOption
          label={i18n.translate('visTypeTableNewNew.params.showTotalLabel', {
            defaultMessage: 'Show total',
          })}
          paramName="showTotal"
          value={styleState.showTotal}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.showTotal = value;
            })
          }
        />

        <SelectOption
          label={i18n.translate('visTypeTableNewNew.params.totalFunctionLabel', {
            defaultMessage: 'Total function',
          })}
          disabled={!styleState.showTotal}
          options={totalAggregations}
          paramName="totalFunc"
          value={styleState.totalFunc}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.totalFunc = value;
            })
          }
        />

        <SelectOption
          label={i18n.translate('visTypeTableNewNew.params.PercentageColLabel', {
            defaultMessage: 'Percentage column',
          })}
          options={percentageColumns}
          paramName="percentageCol"
          value={styleState.percentageCol}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.percentageCol = value;
            })
          }
          id="datatableVisualizationPercentageCol"
        />
      </Option>
    </>
  );
}

export { TableVizOptions };
