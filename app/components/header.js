import React from 'react';

import util from '../lib/util';

module.exports = class Header extends React.Component {
  render () {
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
          <div className='ellipsis' style={{maxWidth: '350px'}}>{state.playlist.selected.name}</div>
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
};
