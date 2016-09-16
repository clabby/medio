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

  render () {
    const state = this.props.state;

    return (
      <div>
        <div className='controls-timeline' ref={(ref) => {this.controlsTimeline = ref}} onClick={(e) => this.handleClick(e)} onMouseMove={(e) => this.handleHover(e)} data-tip data-for='timeline-tooltip'>
          <div className='controls-timeline-progress' style={{width: (state.totalTime === 0 ? 0 : state.time / state.totalTime * 100) + '%'}} />
        </div>
        <Tooltip effect='solid' id='timeline-tooltip' label='Current Time' ref={(ref) => {this.tooltip = ref}}>{util.formatTime(state.time)}</Tooltip>
      </div>
    )
  }
}
