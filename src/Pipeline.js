import Word from './Word';

const handleWordError = async function (error, props, context) {
  if (props && props.onError) {
    props.onError.mergeToProps({ error });

    const onErrorStrategy = await props.onError.say(context);

    if (onErrorStrategy === false) {
      throw new Error(Word.errors.STOP_PROCESSING);
    } else if (onErrorStrategy === true) {
      throw new Error(Word.errors.CONTINUE_PROCESSING);
    } else {
      throw error;
    }      
  } else {
    throw error;
  }
}
function init({ props, context }) {
  // normalizing the props
  props && Object.keys(props).forEach(propName => {
    if (propName.charAt(0) === '$') {
      const prop = propName.substr(1, propName.length);

      if (typeof context[prop] !== 'undefined') {
        props[typeof props[propName] === 'string' ? props[propName] : prop] = context[prop];
        delete props[propName];
      }
    }
  });
};
async function execute(word) {
  const { func, props, context } = word;

  try {
    word.result = await func.call(word, props);

    if (props && props.exports) {
      context[props.exports] = word.result;
    }
  } catch (error) {
    await handleWordError(error, props, context);
  }
}
async function processResult({ result, context }) {
  if (result) {
    if (Word.isItAWord(result)) {
      await result.say(context);
    }
  }
}
async function processChildren({ func, children, result, context }) {
  // FACC pattern
  if (children && children.length === 1 && !Word.isItAWord(children[0])) {
    await Word(children[0], result).say(context);
  
  // nested tags
  } else if (children && children.length > 0) {
    let pointer = 0;
    let parallelProcessing = !!func.processChildrenInParallel;

    while(pointer < children.length) {
      const w = children[pointer];

      try {
        if (parallelProcessing) {
          w.say(context);
        } else {
          await w.say(context);
        }
      } catch (error) {
        if (error.message === Word.errors.STOP_PROCESSING) {
          break;
        } else if(!(error.message === Word.errors.CONTINUE_PROCESSING)) {
          throw error;
        }
      }
      pointer++;
    }
  }
}

export default function Pipeline() {
  const entries = [];
  let pointer = 0;

  return {
    add(func, name) {
      entries.push({ name, func, enabled: true });
    },
    find(n) {
      const entry = entries.find(({ name }) => name === n);

      if (entry) {
        return entry;
      } else {
        throw new Error(`Sorry, there is no pipeline entry with name "${ n }"`);
      }
    },
    enable(name) {
      this.find(name).enabled = true;
    },
    disable(name) {
      this.find(name).enabled = false;
    },
    next() {
      const entry = entries[pointer];

      if (entry) {
        pointer += 1;
        return entry;
      }
      pointer = 0;
      return false;
    },
    run(name, word) {
      const entry = this.find(name);

      entry.enabled = false;
      return entry.func(word);
    }
  }
}

Pipeline.init = init;
Pipeline.execute = execute;
Pipeline.processResult = processResult;
Pipeline.processChildren = processChildren;

export function createDefaultPipeline() {
  const pipeline = Pipeline();

  pipeline.add(init);
  pipeline.add(execute);
  pipeline.add(processResult);
  pipeline.add(processChildren, 'children');

  return pipeline;
}