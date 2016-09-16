import React from 'react';

import { dispatcher } from '../lib/dispatcher';
import util from '../lib/util';

module.exports = class Header extends React.Component {
  render () {
    const loc = this.props.state.location;

    return (
      <div className='header'>
        {this.getTitle()}
      </div>
    )
  }

  getTitle () {
    const state = this.props.state;
    if (state.playlist.selected) {
      return (
        <span className='title'>
          Medio&nbsp;-&nbsp;
          <span className='ellipsis'>{state.playlist.selected.name}</span>
          &nbsp;-&nbsp;
          {util.formatTime(state.time) + '/' + util.formatTime(state.totalTime)}
        </span>
      )
    } else {
      return (
        <span className='title'>Medio</span>
      )
    }
  }
}
