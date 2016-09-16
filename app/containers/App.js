import React, { Component, PropTypes } from 'react';
import Header from '../components/header';

const colors = require('material-ui/styles/colors');

import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

darkBaseTheme.palette.primary1Color = colors.blue500;
darkBaseTheme.palette.primary2Color = colors.blue500;
darkBaseTheme.palette.primary3Color = colors.grey600;
darkBaseTheme.palette.accent1Color = colors.blueA200;
darkBaseTheme.palette.accent2Color = colors.blueA400;
darkBaseTheme.palette.accent3Color = colors.blueA100;
darkBaseTheme.palette.textColor = colors.grey50;
darkBaseTheme.palette.alternativeTextColor = colors.grey50;

const Views = {
  'player': require('./pages/player/player')
};

const Modals = {
  'playlist-modal': require('../components/playlist-modal')
};

export default class App extends Component {

  render() {
    return (
      <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
        <div className='app'>
          {this.getHeader()}
          <div key='content' className='content'>{this.getView()}</div>
          {this.getModal()}
        </div>
      </MuiThemeProvider>
    );
  }

  getHeader () {
    const state = this.props.state;

    if (state.window.fullscreen) {
      return null;
    } else {
      return (
        <Header state={state} />
      );
    }
  }

  getModal () {
    const state = this.props.state;
    if (!state.modal) return;

    const Modal = Modals[state.modal];

    return (
      <Modal state={state} />
    )
  }

  getView () {
    const state = this.props.state;
    const View = Views[state.location.url()];
    return (
      <View state={state} />
    );
  }
}
