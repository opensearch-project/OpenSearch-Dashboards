import classNames from 'classnames';
import React, { FunctionComponent, SVGAttributes } from 'react';
import { AlertIcon } from './assets/alert';
import { DotIcon } from './assets/dot';
import { EmptyIcon } from './assets/empty';
import { EyeIcon } from './assets/eye';
import { EyeClosedIcon } from './assets/eye_closed';
import { ListIcon } from './assets/list';
import { QuestionInCircle } from './assets/question_in_circle';

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

const typeToIconMap = {
  alert: AlertIcon,
  dot: DotIcon,
  empty: EmptyIcon,
  eye: EyeIcon,
  eyeClosed: EyeClosedIcon,
  list: ListIcon,
  questionInCircle: QuestionInCircle,
};
export type IconColor = string;

export type IconType = keyof typeof typeToIconMap;

export interface IconProps {
  className?: string;
  'aria-label'?: string;
  'data-test-subj'?: string;
  type?: IconType;
  color?: IconColor;
}

export type Props = Omit<SVGAttributes<SVGElement>, 'color'> & IconProps;

export const Icon: FunctionComponent<Props> = ({ type, color, className, tabIndex, ...rest }) => {
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

  return (
    <Svg
      className={classes}
      {...optionalCustomStyles}
      tabIndex={tabIndex}
      focusable={focusable}
      {...rest}
    />
  );
};
