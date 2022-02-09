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
 * under the License.
 */

import { ComponentType, ReactNode } from 'react';

import { TooltipPortalSettings } from '../../../components/portal';
import { Position, Color } from '../../../utils/common';
import { AnnotationType, LineAnnotationDatum, RectAnnotationDatum } from '../utils/specs';
import { AnnotationLineProps } from './line/types';
import { AnnotationRectProps } from './rect/types';

/** @public */
export type AnnotationTooltipFormatter = (details?: string) => JSX.Element | null;

/** @public */
export type CustomAnnotationTooltip = ComponentType<{
  header?: string;
  details?: string;
  datum: LineAnnotationDatum | RectAnnotationDatum;
}> | null;

/**
 * The header and description strings for an Annotation
 * @internal
 */
export interface AnnotationDetails {
  headerText?: string;
  detailsText?: string;
}

/**
 * Component to render based on annotation datum
 *
 * @public
 */
export type ComponentWithAnnotationDatum = ComponentType<LineAnnotationDatum>;

/**
 * The marker for an Annotation. Usually a JSX element
 * @internal
 */
export interface AnnotationMarker {
  icon?: ReactNode | ComponentWithAnnotationDatum;
  position: {
    top: number;
    left: number;
  };
  dimension?: {
    width: number;
    height: number;
  };
  body?: ReactNode | ComponentWithAnnotationDatum;
  alignment: Position;
  color: Color;
}

/** @internal */
export interface AnnotationTooltipState {
  isVisible: true;
  annotationType: AnnotationType;
  datum: LineAnnotationDatum | RectAnnotationDatum;
  anchor: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  customTooltipDetails?: AnnotationTooltipFormatter;
  customTooltip?: CustomAnnotationTooltip;
  tooltipSettings?: TooltipPortalSettings<'chart'>;
}

/** @internal */
export type AnnotationDimensions = Array<AnnotationLineProps | AnnotationRectProps>;

/** @internal */
export type Bounds = {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
};
