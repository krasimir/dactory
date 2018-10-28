import { getFuncName, getId } from '../utils';

export default function Element(func, props, children) {
  const scopedVars = props && props.scope ? props.scope.split(/, ?/) : [];

  const element = {
    __actml: true,
    id: getId(),
    func,
    children,
    name: getFuncName(func),
    props,
    scope: {},
    context: undefined,
    parent: undefined,
    debug: false,

    mergeToProps(additionalProps) {
      this.props = Object.assign({}, this.props, additionalProps);
    },
    mergeToScope(additionalProps) {
      this.scope = Object.assign({}, this.scope, additionalProps);
    },
    dispatch(type, value) {
      if (scopedVars.indexOf(type) >= 0 || scopedVars[0] === '*') {
        this.scope[type] = value;
      } else {
        this.parent.dispatch(type, value);
      }
    },
    readFromScope(key, requester) {
      const { scope, parent } = this;

      if (scope.hasOwnProperty(key)) return scope[key];
      return parent.readFromScope(key, requester);
    },
    handleError(error) {
      if (this.props && this.props.onError) {
        this.props.onError.mergeToProps({ error });
        return this.props.onError;
      }
      return this.parent.handleError(error);
    },
    initialize(parent) {
      if (!parent) {
        throw new Error('The Element can not be run with no parent.');
      }
      this.parent = parent;
      this.context = parent.context;
      this.debug = parent.debug;

      // setting the debug flag
      if (this.props && typeof this.props.debug !== 'undefined') {
        this.debug = true;
      }

      if (typeof func === 'string') {
        if (this.context[func]) {
          this.func = this.context[func];
          this.name = getFuncName(this.func);
        } else {
          throw new Error(`"${ func }" is missing in the context.`);
        }
      }

      return this;
    }
  };

  return element;
}
