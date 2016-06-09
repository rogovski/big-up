/**
 * validator instance for session
 */

import I from 'immutable';
import * as jsSchema from 'jsonschema';

const initialState = I.Map({ store: new jsSchema.Validator() });

export default function validator(state = initialState, action) {
  switch (action.type) {

    default:
      return state;
  }
}
