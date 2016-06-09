/**
 * collection of dataframes in session
 */

import I from 'immutable';

const initialState = I.Map({});

export default function dataframe(state = initialState, action) {
  switch (action.type) {

    default:
      return state;
  }
}