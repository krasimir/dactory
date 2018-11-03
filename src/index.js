import * as ReduxMethods from './elements/redux';
import Element from './elements/Element';
import AElement from './elements/A';
import createRootElement from './elements/createRootElement';
import { isItAnElement } from './utils';
import Processor from './processor';

function create(func, props, ...children) {
  return func === create ?
    Element(AElement, { scope: '*', ...props }, children) :
    Element(func, props, children);
}

function run(element, context = {}) {
  return new Promise((done, reject) => {
    if (isItAnElement(element)) {
      (new Processor(
        (error, result) => {
          error ? reject(error) : done(result);
        }
      )).add(element, createRootElement(context));
    } else {
      throw new Error('`run` should be called with an ActML element. You are passing:', element);
    }
  });
}

const Redux = { ...ReduxMethods };
const A = create;

export {
  A,
  run,
  Redux
};
