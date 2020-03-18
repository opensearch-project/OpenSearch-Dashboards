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
import React, { SVGAttributes } from 'react';
import { deepEqual } from '../../utils/fast_deep_equal';
import { AlertIcon } from './assets/alert';
import { DotIcon } from './assets/dot';
import { EmptyIcon } from './assets/empty';
import { EyeIcon } from './assets/eye';
import { EyeClosedIcon } from './assets/eye_closed';
import { ListIcon } from './assets/list';
import { QuestionInCircle } from './assets/question_in_circle';

const typeToIconMap = {
  alert: AlertIcon,
  dot: DotIcon,
  empty: EmptyIcon,
  eye: EyeIcon,
  eyeClosed: EyeClosedIcon,
  list: ListIcon,
  questionInCircle: QuestionInCircle,
};

/** @internal */
export type IconColor = string;

/** @internal */
export type IconType = keyof typeof typeToIconMap;

interface IconProps {
  className?: string;
  'aria-label'?: string;
  'data-test-subj'?: string;
  type?: IconType;
  color?: IconColor;
}

/** @internal */
export type IconComponentProps = Omit<SVGAttributes<SVGElement>, 'color' | 'type'> & IconProps;

/** @internal */
export class Icon extends React.Component<IconComponentProps> {
  shouldComponentUpdate(nextProps: IconComponentProps) {
    return !deepEqual(this.props, nextProps);
  }

  render() {
    const { type, color, className, tabIndex, ...rest } = this.props;
    let optionalCustomStyles = null;

    if (color) {
      optionalCustomStyles = { color };
    }

    const classes = classNames('echIcon', className);

    const Svg = (type && typeToIconMap[type]) || EmptyIcon;

    // This is a fix for IE and Edge, which ignores tabindex="-1" on an SVG, but respects
    // focusable="false".
    //   - If there's no tab index specified, we'll default the icon to not be focusable,
    //     which is how SVGs behave in Chrome, Safari, and FF.
    //   - If tab index is -1, then the consumer wants the icon to not be focusable.
    //   - For all other values, the consumer wants the icon to be focusable.
    const focusable = tabIndex == null || tabIndex === -1 ? 'false' : 'true';

    return <Svg className={classes} {...optionalCustomStyles} tabIndex={tabIndex} focusable={focusable} {...rest} />;
  }
}
