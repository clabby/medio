import _ from 'lodash';
import crypto from 'crypto';
import torrents from 'webtorrent';
import fs from 'fs';
import ytdl from 'ytdl-core';
import duplex from 'duplexify';
import request from 'request';
import path from 'path';

import { dispatch } from './dispatcher';

module.exports = {
  add
};

var allowedExtensions = ['mpg', 'mkv', 'mp4', 'mp3'];

function noop () {  }

function generateId () {
  return crypto.randomBytes(8).toString('hex');
}

var addFunctions = {
  onMagnet: (link, cb) => {
    var engine = torrents();
    var id = generateId();
    dispatch('addLoadingTorrent');

    engine.add(link, {
      announce: [ 'wss://tracker.webtorrent.io' ]
    }, (torrent) => {
      console.log('Torrent ready. Playlist ID: ' + id);
      dispatch('subtractLoadingTorrent');

      var torrents = [];
      _.each(torrent.files, function (f, index) {
        f.downloadSpeed = torrent.downloadSpeed;
        if (/\.(mp4|mkv|mp3)$/i.test(f.name)) {
          f.select();
          f.id = generateId();
          f.torrent = torrent;
          f.torrentFileIndex = index;

          torrents.push(f);
        }
      });
      cb(null, torrents);
    });
  },
  onTorrent: (link, cb) => {
    fs.readFile(link, (err, buf) => {
      if (err) {
        return cb(err);
      }

      addFunctions.onMagnet(buf, cb);
    });
  },
  onYoutube: (link, cb) => {
    var file = {};
    var url = /https?:/.test(link) ? link : 'https:' + link;

    var getYoutubeData = (cb) => {
      ytdl.getInfo(url, (err, info) => {
        if (err) {
          return cb(err);
        }

        var vidFmt;
        var formats = info.formats;

        formats.sort((a, b) => {
          return +a.itag - +b.itag;
        });

        formats.forEach((fmt) => {
          // prefer webm
          if (fmt.itag === '46') return vidFmt = fmt;
          if (fmt.itag === '45') return vidFmt = fmt;
          if (fmt.itag === '44') return vidFmt = fmt;
          if (fmt.itag === '43') return vidFmt = fmt;

          // otherwise h264
          if (fmt.itag === '38') return vidFmt = fmt;
          if (fmt.itag === '37') return vidFmt = fmt;
          if (fmt.itag === '22') return vidFmt = fmt;
          if (fmt.itag === '18') return vidFmt = fmt;
        });

        if (!vidFmt) {
          return cb(new Error('No suitable video format found'));
        }

        cb(null, {info: info, fmt: vidFmt});
      });
    };

    getYoutubeData((err, data) => {
      if (err) {
        return cb(err);
      }

      var fmt = data.fmt;
      var info = data.info;

      request({method: 'HEAD', url: fmt.url}, (err, resp, body) => {
        if (err) {
          return cb(err);
        }

        var len = resp.headers['content-length'];
        if (!len) {
          return cb(new Error('no content-length on response'));
        }

        file.length = +len;
        file.name = info.title;

        file.createReadStream = (opts) => {
          if (!opts) {
            opts = {};
          }

          getYoutubeData((err, data) => {
            if (err) {
              return cb(err);
            }

            var vidUrl = data.fmt.url;
            if (opts.start || opts.end) {
              vidUrl += '&range=' + ([opts.start || 0, opts.end || len].join('-'));
            }

            stream.setReadable(request(vidUrl));
          });

          var stream = duplex();
          return stream;
        };

        var id = generateId();
        console.log('Youtube video ready. Playlist ID: ' + id);
        file.id = id;

        cb(null, file);
      });
    });
  },
  onFile: (link, cb) => {
    var file = {};

    fs.stat(link, (err, st) => {
      if (err) {
        return cb(err);
      }

      file.length = st.size;
      file.name = path.basename(link);
      file.extension = file.name.split(".").pop().toLowerCase();
      if (!_.includes(allowedExtensions, file.extension)) {
        dispatch('setSnackBar', 'Invalid file extension');
        console.log('Invalid file extension');
        return;
      }

      file.createReadStream = (opts) => {
        return fs.createReadStream(link, opts);
      };

      var id = generateId();
      console.log('File loaded. Playlist ID: ' + id);
      file.id = id;

      cb(null, file);
    });
  },
  onHttpLink: (link, cb) => {
    var file = {};

    file.name = link.lastIndexOf('/') > -1 ? link.split('/').pop() : link;
    /* file.extension = file.name.split(".").pop().toLowerCase();
    if (!_.includes(allowedExtensions, file.extension)) {
      dispatch('setSnackBar', 'Invalid file extension.');
      console.log('Invalid file extension');
      return;
    } */

    file.createReadStream = (opts) => {
      if (!opts) {
        opts = {};
      }

      if (opts && (opts.start || opts.end)) {
        var rs = 'bytes=' + (opts.start || 0) + '-' + (opts.end || file.length || '');
        return request(link, {headers: {Range: rs}});
      }

      return request(link);
    };

    request.head(link, (err, response) => {
      if (err) {
        return cb(err);
      }

      if (!/2\d\d/.test(response.statusCode)) {
        return cb(new Error('request failed'));
      }

      file.length = Number(response.headers['content-length']);

      var id = generateId();
      console.log('HTTP Link ready. Playlist ID: ' + id);
      file.id = id;

      cb(null, file);
    });
  }
};

function add (link, cb) {
  link = link.replace('medio://', '').replace('medio:', '');

  if (!cb) {
    cb = noop;
  }

  if (/magnet:/.test(link)) {
    addFunctions.onMagnet(link, cb);
  } else if (/\.torrent$/i.test(link)) {
    addFunctions.onTorrent(link, cb);
  } else if (/youtube\.com\/watch|youtu.be/i.test(link)) {
    addFunctions.onYoutube(link, cb);
  } else if (/^https?:\/\//i.test(link)) {
    addFunctions.onHttpLink(link, cb);
  } else {
    addFunctions.onFile(link, cb);
  }
}
