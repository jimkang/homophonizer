function checkError(error, done) {
  var noError = true;
  if (error) {
    done(error);
    noError = false;
  }
  return noError;
}

module.exports = {
  checkError: checkError
};
