import deltaRequest from './interceptors/request/delta';
import apiResponse from './interceptors/response/api';
import deltaResponse from './interceptors/response/delta';
import errorResponse from './interceptors/response/error';
import outParamResponse from './interceptors/response/out-param';
import resultResponse from './interceptors/response/result';

/**
 * Interceptors is a concept similar to mixins, but run on a lower level. The interceptor concept
 * can augment either the requests (i.e. before sent to QIX Engine), or the responses (i.e. after
 * QIX Engine has sent a response). The interceptor promises runs in parallel to the regular
 * promises used in enigma.js, which means that it can be really useful when you want to normalize
 * behaviors in your application.
 * @interface Interceptor
 */

/**
  * @class InterceptorRequest
  * @implements {Interceptor}
  */

/**
 * @class InterceptorResponse
 * @implements {Interceptor}
 */

/**
 * This method is invoked when a request is about to be sent to QIX Engine.
 * @function InterceptorRequest#onFulfilled
 * @param {Session} session The session executing the interceptor.
 * @param {Object} request The JSON-RPC request that will be sent.
 */

/**
 * This method is invoked when a previous interceptor has rejected the
 * promise, use this to handle for example errors before they are sent into mixins.
 * @function InterceptorResponse#onRejected
 * @param {Session} session The session executing the interceptor. You may use .retry() to retry
 * sending it to QIX Engine.
 * @param {Object} request The JSON-RPC request resulting in this error.
 * @param {Object} error Whatever the previous interceptor is rejected with.
 */

/**
 * This method is invoked when a promise has been successfully resolved,
 * use this to modify the result or reject the promise chain before it is sent
 * to mixins.
 * @function InterceptorResponse#onFulfilled
 * @param {Session} session The session executing the interceptor.
 * @param {Object} request The JSON-RPC request resulting in this response.
 * @param {Object} result Whatever the previous interceptor is resolved with.
 */
class Intercept {
  /**
  * Create a new Intercept instance.
  * @private
  * @param {Object} options The configuration options for this class.
  * @param {Promise<Object>} options.Promise The promise constructor to use.
  * @param {ApiCache} options.apis The ApiCache instance to use.
  * @param {Array<Object>} [options.request] The additional request interceptors to use.
  * @param {Array<Object>} [options.response] The additional response interceptors to use.
  */
  constructor(options) {
    Object.assign(this, options);
    this.request = [{ onFulfilled: deltaRequest }, ...this.request || []];
    this.response = [
      { onFulfilled: errorResponse },
      { onFulfilled: deltaResponse },
      { onFulfilled: resultResponse },
      { onFulfilled: outParamResponse },
      ...this.response || [],
      { onFulfilled: apiResponse },
    ];
  }

  /**
  * Execute the request interceptor queue, each interceptor will get the result from
  * the previous interceptor.
  * @private
  * @param {Session} session The session instance to execute against.
  * @param {Promise<Object>} promise The promise to chain on to.
  * @returns {Promise<Object>}
  */
  executeRequests(session, promise) {
    return this.request.reduce((interception, interceptor) => {
      const intercept = interceptor.onFulfilled
      && interceptor.onFulfilled.bind(this, session);
      return interception.then(intercept);
    }, promise);
  }

  /**
  * Execute the response interceptor queue, each interceptor will get the result from
  * the previous interceptor.
  * @private
  * @param {Session} session The session instance to execute against.
  * @param {Promise<Object>} promise The promise to chain on to.
  * @param {Object} request The JSONRPC request object for the intercepted response.
  * @returns {Promise<Object>}
  */
  executeResponses(session, promise, request) {
    return this.response.reduce((interception, interceptor) => interception.then(
      interceptor.onFulfilled && interceptor.onFulfilled.bind(this, session, request),
      interceptor.onRejected && interceptor.onRejected.bind(this, session, request),
    ),
    promise);
  }
}

export default Intercept;
