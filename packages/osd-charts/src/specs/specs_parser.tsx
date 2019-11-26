import React, { useEffect } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { specParsed, specUnmounted } from '../state/actions/specs';

export const SpecsParserComponent: React.FunctionComponent<{}> = (props) => {
  const injected = props as DispatchProps;
  useEffect(() => {
    injected.specParsed();
  });
  useEffect(
    () => () => {
      injected.specUnmounted();
    },
    [],
  );
  return props.children ? (props.children as React.ReactElement) : null;
};

interface DispatchProps {
  specParsed: () => void;
  specUnmounted: () => void;
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps =>
  bindActionCreators(
    {
      specParsed,
      specUnmounted,
    },
    dispatch,
  );

export const SpecsParser = connect(
  null,
  mapDispatchToProps,
)(SpecsParserComponent);
