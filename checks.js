function checkError(error, done) {
  var noError = true;
  if (error) {
    done(error);
    noError = false;
  }
  return noError;
}

// opts must include onFail and onSuccess functions. onFail will be passed the 
// error. onSuccess will be passed everything except the error.
function createCallbackBranch(opts) {
  return function branchOnError(error) {
    if (error) {
      opts.onFail(error);
    }
    else {
      var args = Array.prototype.slice.call(arguments, 1);
      opts.onSuccess.apply(opts.onSuccess, args);
    }
  };
}


module.exports = {
  checkError: checkError,
  createCallbackBranch: createCallbackBranch
};
