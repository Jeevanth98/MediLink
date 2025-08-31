import 'react-native';
import React from 'react';
import App from '../src/App';

// Note: import explicitly to use the types shipped with jest.
import {it, expect} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, { act } from 'react-test-renderer';

it('renders correctly', () => {
  let tree;
  act(() => {
    tree = renderer.create(<App />);
  });
  expect(tree).toBeDefined();
});
