// http://json-schema.org/documentation.html
// https://www.npmjs.com/package/jsonschema
// https://github.com/tdegrunt/jsonschema
// http://pandas.pydata.org/pandas-docs/stable/10min.html

import { createStore, combineReducers, applyMiddleware, compose  } from 'redux';
import thunk from 'redux-thunk';
import reducers from './reducers';
import I from 'immutable';
import * as jsSchema from 'jsonschema';
import _ from 'lodash';


/**
 * note: store is like RAM
 */
const reducer = combineReducers(reducers);
const store = createStore(reducer);



class DataFrame {
  constructor(options) {
    this.options = options || {};
    this.schema = {};
    this.data = [];
  }
}

class LocalDataFrame extends DataFrame {
  constructor(options) {
    super(options);
  }

  bindSchema(schema) {
    this.schema = schema;
  }

  unbindSchema() {
    this.schema = {};
  }

  loadObjectsUnsafe(objls) {
    this.data = objls;
  }

  linkSchema(v) {
    if(!_.has(v, 'schemas.' + this.schema.id)) {
      v.addSchema(this.schema);
    }
  }

  loadObjects(v, objls) {
    this.linkSchema(v);

    let i = 0;
    for(; i < objls.length; i++) {
      const result = v.validate(objls[i], this.schema);
      if(result.errors.length !== 0) {
        throw new Error(result.errors);
      }
    }
    this.data = objls;
  }
}

const validators = new jsSchema.Validator();

const someDataFrame = new LocalDataFrame();
someDataFrame.bindSchema({
  id: 'someDataFrame',
  type: 'object',
  properties: {
    Title: {type: 'string'},
    Description: {type: 'string'},
    Date: {type: 'integer'},
    Partition: {type: 'integer'},
    Value: {type: 'number'}
  },
  required: [
    'Title',
    'Description',
    'Date',
    'Partition',
    'Value'
  ]
});

someDataFrame.linkSchema(validators);

someDataFrame.loadObjects(validators, [
  {Title:'ok',Description:'1',Date:1234,Partition:0,Value:1.1}
]);



store.subscribe(() => {
  console.log(store.getState());
});

// a process that represents a shell instance
class ShellProc {
  constructor(st) {
    this.st = st;
    this.pid = 1234; // generate
    store.subscribe(() => {
      this.handleStdout();
    });
    store.subscribe(() => {
      this.handleStderr();
    });
  }

  writeStdin(obj) {
    this.st.dispatch({
      type: 'PROC_STDIN',
      pid: this.pid,
      data: obj,
      exit: 0,
      stdoutRedir: null,
      stderrRedir: null
    });
  }

  handleStdout() {
    const state = store.getState();

    // only handle PROC actions
    if(state.lastAction.type !== 'PROC_STDIN') {
      return;
    }

    // only handle actions initiated by this PROC
    if(state.lastAction.pid !== this.pid) {
      return;
    }

    // only handle success exit codes
    if(state.lastAction.exit !== 0) {
      return;
    }

    if(state.lastAction.stdoutRedir !== null) {
      console.log('REDIRECT');
    }
    else {
      console.log(state.lastAction.data);
    }
  }

  handleStderr() {
    // TODO
  }
}


window.sh = new ShellProc(store); // store;
window.I = I;

window.someDataFrame = someDataFrame;
window.validators = validators;