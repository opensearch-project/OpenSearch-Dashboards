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

// import React from 'react';
// import Animate from 'react-move/Animate';
// import { LineSeriesGlyph, StackedLineSeriesGlyph } from '../utils/line_series_utils';
// interface LineSeriesDataProps {
//   animated?: boolean;
//   line: LineSeriesGlyph;
// }

// export class LineSeries extends React.PureComponent<LineSeriesDataProps> {
//   public static defaultProps: Partial<LineSeriesDataProps> = {
//     animated: false,
//   };
//   public render() {
//     const { animated, line } = this.props;
//     if (line.d === null) {
//       return null;
//     }
//     if (!animated) {
//       if (Array.isArray(line)) {
//         return this.renderStackedLines(line);
//       }
//       return this.renderLine(line as LineSeriesGlyph);
//     }
//     return this.renderAnimatedLine(line.d);
//   }
//   private renderAnimatedLine = (d: string) => {
//     return (
//       <Animate
//       start={{
//         key: 'transform',
//         d,
//       }}
//       update={{
//         key: 'transform',
//         d: [d],
//       }}
//       >
//       {
//         (state) => {
//           return (
//            <g className="euiSeriesChartSeries_lineGroup">
//               <path className="euiSeriesChartSeries_line" d={state.d as string}/>
//             </g>
//          );
//         }
//       }
//       </Animate>
//     );
//   }
//   private renderLine = (line: LineSeriesGlyph) => {
//     if (!line.d) {
//       return null;
//     }
//     return (
//       <g className="euiSeriesChartSeries_lineGroup">
//         <path className="euiSeriesChartSeries_line" d={line.d}/>
//       </g>
//     );
//   }
//   private renderStackedLines = (lines: StackedLineSeriesGlyph) => {
//     return (
//       <g className="euiSeriesChartSeries_lineGroup">
//       {
//         lines.map((line, index) => {
//           return (
//             <path key={`line-${index}`} className="euiSeriesChartSeries_line" d={line.d as string}/>
//           );
//         })
//       }
//       </g>
//     );
//   }
// }
