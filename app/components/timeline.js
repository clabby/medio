import React from 'react';
import ReactDOM from 'react-dom';

import { dispatcher, dispatch } from '../lib/dispatcher';
import util from '../lib/util';
import Tooltip from 'react-tooltip';

module.exports = class Timeline extends React.Component {
  constructor (props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.handleHover = this.handleHover.bind(this);
  }

  handleClick (e) {
    const state = this.props.state;

    var time = e.pageX / this.controlsTimeline.offsetWidth * state.totalTime;
    this.props.video.currentTime = time;
    dispatch('setTime', time);
  }

  handleHover (e) {
    var tooltip = ReactDOM.findDOMNode(this.tooltip);
    var percentage = e.pageX / this.controlsTimeline.offsetWidth;
    var time = util.formatTime(percentage * state.totalTime);
    tooltip.innerHTML = time;
    tooltip.style.left = (e.pageX - tooltip.offsetWidth / 2) + 'px';
  }

  renderTimeline () {
    const state = this.props.state;

    if (state.playlist.selected && state.playlist.selected.torrent) {
      const torrentSummary = util.getTorrentProgressSummary(state.playlist.selected.torrent);
      const fileProgress = torrentSummary.files[state.playlist.selected.torrentFileIndex];
      const parts = [];

      var lastPiecePresent = false;
      for (var i = fileProgress.startPiece; i <= fileProgress.endPiece; i++) {
        const partPresent = torrentSummary.bitfield.get(i);
        if (partPresent && !lastPiecePresent) {
          parts.push({start: i - fileProgress.startPiece, count: 1});
        } else if (partPresent) {
          parts[parts.length - 1].count++;
        }
        lastPiecePresent = partPresent;
      }

      return parts.map(function (part, index) {
        var style = {
          left: (100 * part.start / fileProgress.totalPieces) + '%',
          width: (100 * part.count / fileProgress.totalPieces) + '%'
        };
        return (
          <div key={index} className='controls-timeline-part' style={style}></div>
        )
      });
    }
  }

  render () {
    const state = this.props.state;

    return (
      <div>
        <div className='controls-timeline' ref={(ref) => {this.controlsTimeline = ref}} onClick={(e) => this.handleClick(e)} onMouseMove={(e) => this.handleHover(e)} data-tip data-for='timeline-tooltip'>
          {this.renderTimeline()}
          <div className='controls-timeline-progress' style={{width: (state.totalTime === 0 ? 0 : state.time / state.totalTime * 100) + '%'}} />
        </div>
        <Tooltip effect='solid' id='timeline-tooltip' label='Current Time' ref={(ref) => {this.tooltip = ref}}>{util.formatTime(state.time)}</Tooltip>
      </div>
    )
  }
}
