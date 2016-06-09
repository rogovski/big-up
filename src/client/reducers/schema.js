/**
 * collection of schemas in session
 */

import I from 'immutable';

const initialState = I.Map({});

export default function schema(state = initialState, action) {
  switch (action.type) {

    default:
      return state;
  }
}