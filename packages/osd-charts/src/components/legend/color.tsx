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

import React from 'react';
import classNames from 'classnames';
import { Icon } from '../icons/icon';

interface ColorProps {
  color: string;
  isSeriesHidden?: boolean;
  hasColorPicker: boolean;
  onColorClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}
/**
 * Color component used by the legend item
 * @internal
 */
export function Color({ color, isSeriesHidden = false, hasColorPicker, onColorClick }: ColorProps) {
  if (isSeriesHidden) {
    return (
      <div className="echLegendItem__color" aria-label="series hidden" title="series hidden">
        {/* changing the default viewBox for the eyeClosed icon to keep the same dimensions */}
        <Icon type="eyeClosed" viewBox="-3 -3 22 22" />
      </div>
    );
  }

  const colorClasses = classNames('echLegendItem__color', {
    'echLegendItem__color--changable': hasColorPicker,
  });

  return (
    <div onClick={onColorClick} className={colorClasses} aria-label="series color" title="series color">
      <Icon type="dot" color={color} />
    </div>
  );
}
