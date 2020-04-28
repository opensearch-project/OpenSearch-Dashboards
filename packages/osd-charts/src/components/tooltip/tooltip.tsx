/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import classNames from 'classnames';
import React, { forwardRef, memo, useCallback } from 'react';
import { TooltipInfo } from './types';
import { TooltipValueFormatter, TooltipValue } from '../../specs';

interface TooltipProps {
  info: TooltipInfo;
  headerFormatter?: TooltipValueFormatter;
}

const TooltipComponent = forwardRef<HTMLDivElement, TooltipProps>(({ info, headerFormatter }, ref) => {
  const renderHeader = useCallback(
    (headerData: TooltipValue | null, formatter?: TooltipValueFormatter) => {
      if (!headerData || !headerData.isVisible) {
        return null;
      }
      return <div className="echTooltip__header">{formatter ? formatter(headerData) : headerData.value}</div>;
    },
    [info.header, headerFormatter],
  );

  return (
    <div className="echTooltip" ref={ref}>
      {renderHeader(info.header, headerFormatter)}
      <div className="echTooltip__list">
        {info.values.map(
          ({ seriesIdentifier, valueAccessor, label, value, markValue, color, isHighlighted, isVisible }, index) => {
            if (!isVisible) {
              return null;
            }
            const classes = classNames('echTooltip__item', {
              /* eslint @typescript-eslint/camelcase:0 */
              echTooltip__rowHighlighted: isHighlighted,
            });
            return (
              <div
                // NOTE: temporary to avoid errors
                key={`${seriesIdentifier.key}__${valueAccessor}__${index}`}
                className={classes}
                style={{
                  borderLeftColor: color,
                }}
              >
                <span className="echTooltip__label">{label}</span>
                <span className="echTooltip__value">{value}</span>
                {markValue && <span className="echTooltip__markValue">&nbsp;({markValue})</span>}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
});

/** @internal */
export const Tooltip = memo(TooltipComponent);
