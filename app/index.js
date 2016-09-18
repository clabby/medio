import React from 'react';
import { render } from 'react-dom';
import App from './containers/App';
import dragDrop from 'drag-drop'

const mdns = require('multicast-dns')();
const http = require('http');
const network = require('network-address');
const JSONStream = require('JSONStream');
const pump = require('pump');
const rangeParser = require('range-parser');
const _ = require('lodash');

import { remote, clipboard } from 'electron';
const { dialog, Menu, MenuItem } = remote;

import State from './lib/state';
import Playlist from './lib/playlist';

import './assets/styles/style.scss';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

let server;
let app;

window.dispatch = dispatch;
require('./lib/dispatcher').setDispatch(dispatch);

let state = window.state = State.getDefaultState();

document.onpaste = function () {
  dispatch('addToPlaylist', clipboard.readText().split('\n'));
};

document.addEventListener('keydown', function (e) {
  if (e.keyCode === 32) {
    return dispatch('playPause');
  } else if (e.keyCode === 27 && state.window.fullscreen) {
    return dispatch('fullscreen');
  }
}, false);

dragDrop('body', function (files) {
  let paths = _.map(files, function (file) {
    return file.path;
  });
  dispatch('addToPlaylist', paths);
});

let idleMouseTimer;
let forceMouseHide = false;

document.addEventListener('mousemove', function() {
  if(!forceMouseHide) {
    document.querySelector('body').className = '';

    clearTimeout(idleMouseTimer);

    idleMouseTimer = setTimeout(function() {
      document.querySelector('body').className = 'mouse-idle';

      forceMouseHide = true;
      setTimeout(function() {
        forceMouseHide = false;
      }, 200);
    }, 2500);
  }
}, false);

const dispatchHandlers = {
  'setLoading': (value) => {
    state.loading = value;
  },
  'setRepeating': (value) => {
    state.repeating = value;
  },
  'playPause': () => {
    if (!state.playlist.selected) return;

    state.playing = !state.playing;
  },
  'setPlaying': (value) => {
    if (!state.playlist.selected) return;

    state.playing = value;
  },
  'changeVolume': (value) => {
    state.volume = value;
  },
  'fullscreen': (value) => {
    remote.getCurrentWindow().setFullScreen(!!value);
  },
  'showVolumeSlider': (value) => {
    state.showVolumeSlider = value;
  },
  'setTime': (value) => {
    state.time = value;
  },
  'setTotalTime': (value) => {
    state.totalTime = value;
  },
  'setModal': (value) => {
    state.window.modal = value;
  },
  'setLoadingTorrents': (value) => {
    state.loadingTorrents = value;
  },
  'addLoadingTorrent': () => {
    state.loadingTorrents += 1;
  },
  'subtractLoadingTorrent': () => {
    state.loadingTorrents -= 1;
  },
  'exitModal': () => {
    state.window.modal = null;
  },
  'openFileSelect': () => {
    let files = dialog.showOpenDialog({ properties: [ 'openFile', 'multiSelections' ]});
    if (files) {
      dispatch('addToPlaylist', files);
    }
  },
  'addToPlaylist': (links) => {
    _.each(links, function (link) {
      Playlist.add(link, function (err, obj) {
        if (err) {
          return console.log(err);
        }

        state.playlist.entries.push(obj);

        if (state.playlist.entries.length === 1) {
          dispatch('select', obj);
        }
      });
    });

    if (!state.window.modal) {
      dispatch('setModal', 'playlist-modal');
    }
  },
  'deleteFromPlaylist': (id) => {
    if (state.playlist.selected.id === id) {
      return;
    }

    _.pull(state.playlist.entries, _.find(state.playlist.entries, {id: id}));
  },
  'select': (selected) => {
    state.playlist.selected = selected;
    state.playlist.selectedLink = 'http://127.0.0.1:' + server.address().port + '/' + selected.id;
    state.playing = true;
  },
  'selectNext': () => {
    let index = state.playlist.entries.indexOf(state.playlist.selected);
    if (index + 1 >= state.playlist.entries.length) {
      index = -1;
    }

    dispatch('select', state.playlist.entries[index + 1]);
  },
  'setWindowTitle': (title) => {
    state.window.title = title;
  }
};

remote.getCurrentWindow().on('enter-full-screen', function () {
  state.window.fullscreen = true;
});

remote.getCurrentWindow().on('leave-full-screen', function () {
  state.window.fullscreen = false;
});

// This behavior is a bit odd...
/* window.addEventListener('dblclick', () => {
  dispatch('fullscreen', !state.fullscreen);
}, false); */

window.addEventListener('contextmenu', (e) => {
  let menu = new Menu();

  menu.append(new MenuItem({
    label: 'Paste Link',
    role: 'paste',
    accelerator: 'CmdOrCtrl+V',
    click: () => {
      dispatch('addToPlaylist', clipboard.readText().split('\n'));
    }
  }));

  menu.popup(remote.getCurrentWindow());
}, false);

function dispatch (action, ...args) {
  const handler = dispatchHandlers[action];
  if (handler) handler(...args);
  else console.error('Missing dispatch handler: ' + action);

  update();
}

function update () {
  app.setState(state);
  updateElectron();
}

function updateElectron () {
  if (state.window.title !== state.prev.title) {
    state.prev.title = state.window.title;
  }
}

function createVideoServer () {
  server = http.createServer((req, res) => {
    if (req.headers.origin) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }

    if (req.url === '/follow') {
      if (!state.playlist.selected) {
        return res.end();
      }

      let stringify = JSONStream.stringify();

      stringify.pipe(res);
      stringify.write({type: 'open', url: 'http://' + network() + ':' + server.address().port + '/' + state.playlist.selected.id, time: state.time});
      return;
    }

    let id = req.url.slice(1);
    let file = _.find(state.playlist.entries, {id: id});

    if (!file) {
      res.statusCode = 404;
      res.end();
      return;
    }

    let range = req.headers.range && rangeParser(file.length, req.headers.range)[0];

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', 'video/mp4');

    if (!range) {
      res.setHeader('Content-Length', file.length);
      if (req.method === 'HEAD') return res.end();
      pump(file.createReadStream(), res);
      return;
    }

    res.statusCode = 206;
    res.setHeader('Content-Length', range.end - range.start + 1);
    res.setHeader('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + file.length);
    if (req.method === 'HEAD') {
      return res.end();
    }

    pump(file.createReadStream(range), res);
  });

  server.listen(0, () => {
    console.log('Medio server running on port ' + server.address().port);

    mdns.on('query', (query) => {
      let valid = query.questions.some((q) => {
        return q.name === 'medio';
      });

      if (!valid) return;

      mdns.respond({
        answers: [{
          type: 'SRV',
          ttl: 5,
          name: 'medio',
          data: {port: server.address().port, target: network()}
        }]
      });
    });
  });
}

state.location.go({
  url: 'player',
  setup: (cb) => {
    state.window.title = 'Medio';
    cb(null);
  }
});

app = render(
  <App state={state} />,
  document.getElementById('root')
);
setInterval(update, 1000);

createVideoServer();
