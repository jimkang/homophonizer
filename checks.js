function checkError(error, done) {
  var noError = true;
  if (error) {
    done(error);
    noError = false;
  }
  return noError;
}

// Intended to be used with currying.
function branchOnError(onFail, onSuccess, error) {
  if (error) {
    onFail(error);
  }
  else {
    var args = Array.prototype.slice.call(arguments, 3);
    onSuccess.apply(onSuccess, args);
  }
}

module.exports = {
  checkError: checkError,
  branchOnError: branchOnError
};
