import { createDefaultPipeline } from './Pipeline';

export default function Word(func, props, children) {
  return {

    func,
    props,
    children,
    pipeline: func.pipeline || createDefaultPipeline(),
    result: undefined,
    context: undefined,

    mergeToProps(additionalProps) {
      this.props = Object.assign({}, this.props, additionalProps);
    },
    async say(context) {
      this.context = context;
      let pipelineEntry;

      while(pipelineEntry = this.pipeline.next()) {
        if (pipelineEntry.enabled) {
          await pipelineEntry.func(this);
        }
      }

      return this.result;
    }
  }
}

// Static props
Word.isItAWord = word => word && !!word.say;
Word.errors = {
  STOP_PROCESSING: 'STOP_PROCESSING',
  CONTINUE_PROCESSING: 'CONTINUE_PROCESSING'
};