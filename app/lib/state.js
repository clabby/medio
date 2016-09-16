import { EventEmitter } from 'events';

const State = module.exports = Object.assign(new EventEmitter(), {
  getDefaultState
});

function getDefaultState () {
  const LocationHistory = require('location-history');

  return {
    repeating: false,
    paused: true,
    playing: false,
    time: 0.0,
    totalTime: 0.0,
    loading: false,
    showVolumeSlider: false,
    playlist: {
      selected: null,
      selectedLink: null,
      entries: []
    },
    window: {
      title: 'Medio',
      fullscreen: false
    },
    prev: {
      title: null
    },
    volume: 0.5,
    playbackRate: 1.0,
    modal: null,
    location: new LocationHistory()
  };
}
