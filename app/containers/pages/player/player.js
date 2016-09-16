import React, { Component } from 'react';

import { dispatch, dispatcher } from '../../../lib/dispatcher';
import util from '../../../lib/util';

import { Slider, CircularProgress } from 'material-ui';
import Tooltip from 'react-tooltip';
import PlaylistModal from '../../../components/playlist-modal';
import Timeline from '../../../components/timeline';
import ReactVideo from 'react.video';

export default class Player extends Component {
  constructor (props) {
    super(props);

    this.timelineTask = null;
  }

  componentDidUpdate () {
    const state = this.props.state;

    if (this.video) {
      this.video.volume = state.volume;

      this.video.onwaiting = () => {
        dispatch('setLoading', true);
      };
      this.video.onplaying = () => {
        dispatch('setLoading', false);
      };

      if (state.playing && this.video.paused) {
        if (this.video.readyState !== 4) {
          this.video.removeEventListener('loadedmetadata', null, false);
          this.video.addEventListener('loadedmetadata', () => {
            dispatch('setTotalTime', this.video.duration);
          }, false);

          this.video.removeEventListener('ended', null, false);
          this.video.addEventListener('ended', () => {
            if (state.repeating) {
              dispatch('select', state.playlist.selected);
            } else {
              dispatch('selectNext');
            }
          }, false);

          this.video.load();
          if (this.timelineTask) {
            clearInterval(this.timelineTask);
          }

          this.timelineTask = setInterval(() => {
            dispatch('setTime', this.video.currentTime);
          }, 500);
        }
        this.video.play();
      } else if (!state.playing && !this.video.paused) {
        this.video.pause();
      }
    }
  }

  render() {
    const state = this.props.state;

    const volumeStyle = {
      background: '-webkit-gradient(linear, left top, right top, color-stop(' + (state.volume * 100) + '%, #2196F3), color-stop(' + (state.volume * 100) + '%, #727272))',
      display: (state.showVolumeSlider ? 'inline-block' : 'none')
    };

    return (
      <div>
        <div className='loading' style={{display: state.loading ? 'flex' : 'none'}}>
          <CircularProgress size={2} />
        </div>
        <video className='media' ref={(ref) => {this.video = ref}} src={state.playlist.selectedLink} />
        <div className='controls'>
          <Timeline state={state} video={this.video} />
          <div className='controls-left'>
            <i className='icon' onClick={dispatcher('playPause')}>{state.playing ? 'pause' : 'play_arrow'}</i>
            <i className={'icon ' + (state.repeating ? 'repeating' : '')} onClick={dispatcher('setRepeating', !state.repeating)}>refresh</i>
            <i className='icon' data-tip data-for='volume-tooltip' onClick={dispatcher('showVolumeSlider', !state.showVolumeSlider)}>{state.volume == 0.0 ? 'volume_off' : state.volume < 0.5 ? 'volume_down' : 'volume_up'}</i>
            <Tooltip effect='solid' id='volume-tooltip' label='Change Volume'>{'Volume: ' + Math.round(state.volume * 100) + '%'}</Tooltip>

            <input
              className='volume-slider right'
              type='range' min='0' max='1' step='0.05'
              value={state.volume}
              style={volumeStyle}
              onChange={(event) => dispatch('changeVolume', event.target.value)} />
          </div>
          <div className='controls-right'>
            <i className='icon' onClick={dispatcher('setModal', 'playlist-modal')}>playlist_play</i>
            <i className='icon' onClick={dispatcher('fullscreen', !state.window.fullscreen)}>{state.window.fullscreen ? 'fullscreen_exit' : 'fullscreen'}</i>
          </div>
        </div>
      </div>
    );
  }
}
