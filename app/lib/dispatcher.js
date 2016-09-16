module.exports = {
  dispatch,
  dispatcher,
  setDispatch
};

const dispatchers = {};
let _dispatch = function () {};

function setDispatch (dispatch) {
  _dispatch = dispatch;
}

function dispatch (...args) {
  _dispatch(...args);
}

function dispatcher (...args) {
  const str = JSON.stringify(args);
  let handler = dispatchers[str];
  if (!handler) {
    handler = dispatchers[str] = function (e) {
      e.stopPropagation();

      if (e.currentTarget.classList.contains('disabled')) return;

      dispatch(...args);
    }
  }

  return handler;
}
