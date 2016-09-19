import { EventEmitter } from 'events';

module.exports = Object.assign(new EventEmitter(), {
  getDefaultState
});

function getDefaultState () {
  const LocationHistory = require('location-history');

  return {
    repeating: false,
    playing: false,
    time: 0.0,
    totalTime: 0.0,
    loading: false,
    showVolumeSlider: false,
    loadingTorrents: 0,
    playlist: {
      selected: null,
      selectedLink: null,
      entries: []
    },
    window: {
      title: 'Medio',
      modal: null,
      fullscreen: false
    },
    snackBar: null,
    prev: {
      title: null
    },
    volume: 0.5,
    playbackRate: 1.0,
    location: new LocationHistory()
  };
}
