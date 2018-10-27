/** @jsx A */
import { A, run } from '..';

const fakeAsync = (resolveWith, delay) => new Promise(done => {
  setTimeout(() => done(resolveWith), delay);
});

describe('Given the ActML library', () => {
  describe('when there is an error', () => {
    it.only('should swallow the error by default', async () => {
      const Problem = function () {
        return iDontExist; // throws an error "iDontExist is not defined"
      };
      const Z = jest.fn();
      const B = jest.fn();
      const Handler = jest.fn();

      await run(
        <A>
          <Z />
          <Problem onError={ <Handler /> }/>
          <B />
        </A>
      );

      expect(Z).toBeCalled();
      expect(B).toBeCalled();
      expect(Handler).toBeCalled();
    });
    it('should continue processing the siblings', async () => {
      const Problem = function () {
        return iDontExist; // throws an error "iDontExist is not defined"
      };
      const App = function () {};
      const HandleError = jest.fn();
      const AfterError = jest.fn();

      await run(
        <App exports='answer'>
          <Problem onError={ <HandleError /> } />
          <AfterError />
        </App>
      );
      expect(HandleError).toBeCalled();
      expect(AfterError).toBeCalled();
    });
    it('should fire the onError handler with the given error', async () => {
      const Problem = function () {
        return iDontExist; // throws an error "iDontExist is not defined"
      };
      const App = function () {};
      const spy = jest.fn();
      const HandleError = ({ error }) => (spy(error.message), false);

      await run(
        <App>
          <Problem onError={ <HandleError /> } />
        </App>
      );
      expect(spy).toBeCalledWith('iDontExist is not defined');
    });
    it('should allow the handler to access scoped variables', async () => {
      const Problem = function () {
        return iDontExist; // throws an error "iDontExist is not defined"
      };
      const spy = jest.fn();
      const App = function () { return 42 };
      const HandleError = ({ answer }) => (spy(answer), false);
      
      await run(
        <App exports='answer'>
          <Problem onError={ <HandleError $answer /> } />
        </App>
      );
      expect(spy).toBeCalledWith(42);
    });
    it('should continue the execution if the error is handled', async () => {
      const Problem = () => iDontExist();
      const CatchError = () => {};
      const Foo = function * () {
        return 'foo';
      };
      const Bar = function * () {
        return (
          <Problem onError={<CatchError />}>
            <Foo exports="foo" />
          </Problem>
        );
      };
      const result = await run(<A><Bar /></A>);

      expect(result.foo).toEqual('foo');
    });
    it('should handle the error of the children', async () => {
      const Problem = function * () {
        return iDontExist; // throws an error "iDontExist is not defined"
      };

      function * WithProblem() {
        return (
          <A>
            <Problem />
          </A>
        );
      }
      function Wrapper() {
        return <A><WithProblem /></A>;
      }
      const Z = jest.fn();
      const B = jest.fn();
      const Handler = jest.fn();

      await run(
        <A>
          <Z />
          <Wrapper onError={ <Handler /> }/>
          <B />
        </A>
      );

      expect(Z).toBeCalled();
      expect(B).toBeCalled();
      expect(Handler).toBeCalled();
    });
    it('should be able to catch an error from the children', () => {
      const Z = function Z() { throw new Error('Hello world'); };
      const Logic = function ({ children }) {
        children({});
      };

      return run(
        <Logic>
          (
            <Z />
          )
        </Logic>
      ).catch(error => {
        expect(error.message).toBe('Hello world');
      });
    });
    it('should be able to catch an error from the children even if they are async functions', () => {
      const Z = async function Z() {
        await fakeAsync(null, 20);
        throw new Error('Hello world');
      };
      const Logic = function ({ children }) {
        children({});
      };

      return run(
        <Logic>
          (
            <Z />
          )
        </Logic>
      ).catch(error => {
        expect(error.message).toBe('Hello world');
      });
    });
    it.only('should not swallow the error from an async FaCC child', async () => {
      const Z = async function Z() {
        await fakeAsync(null, 20);
        throw new Error('Ops!');
      };
      const Logic = async function ({ children }) {
        await children();
      };

      try {
        await run(
          <Logic>
            {
              function facc() { return <Z />; }
            }
          </Logic>
        );
      } catch (error) {
        console.log('ERRROR', error.message);
        expect(error.message).toBe('Ops!ss ');
      };
    });
  });
});