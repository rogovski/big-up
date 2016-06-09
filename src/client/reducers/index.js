import schema from './schema.js';
import dataframe from './dataframe.js';
import validator from './validator.js';

function lastAction (state = null, action) {
  return action;
}

export default { schema, dataframe, validator, lastAction };