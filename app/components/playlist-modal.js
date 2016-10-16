import React from 'react';

import { dispatch } from '../lib/dispatcher';
import { Dialog, RaisedButton, ListItem } from 'material-ui';

import _ from 'lodash';

module.exports = class PlaylistModal extends React.Component {
  getPlaylistItems () {
    const state = this.props.state;
    let entries = [];

    if (state.loadingTorrents > 0) {
      _.times(state.loadingTorrents, function (index) {
        entries.push(
          <ListItem primaryText={<i>Loading Torrent #{index + 1}...</i>} key={'loading-' + index} style={{textAlign: 'center'}}/>
        );
      });
    }

    if (state.playlist.entries.length < 1 && state.loadingTorrents < 1) {
      entries.push(
        <ListItem primaryText={'Playlist is empty!'} key='nothing' style={{textAlign: 'center'}} />
      );
    } else {
      _.each(state.playlist.entries, function (entry) {
        entries.push(
          <ListItem onClick={() => dispatch('select', entry)} key={Math.random()} className={'playlist-entry ' + (state.playlist.selected.id === entry.id ? 'selected' : '')} rightIcon={<i className='icon' onClick={(e) => {
            e.stopPropagation();
            dispatch('deleteFromPlaylist', entry.id);
          }}>delete</i>}>
            <div className='ellipsis'>{entry.name}</div>
          </ListItem>
        );
      });
    }
    return entries;
  }

  render () {
    const actions = [
      (
        <RaisedButton
          label='ADD FILE(S)'
          primary={true}
          onTouchTap={() => dispatch('openFileSelect')}
          style={{display: 'block', padding: '5px'}}
          labelStyle={{color: '#fff'}}
        />
      )
    ];

    return (
      <Dialog
        modal={false}
        open={true}
        onRequestClose={() => dispatch('exitModal')}
        autoScrollBodyContent={true}
        className='playlist-modal'
        title='Playlist'
        actions={actions}
      >
        <div style={{display: 'block', marginTop: '25px'}}>
          <i className='icon close' onClick={() => dispatch('exitModal')}>close</i>
          {this.getPlaylistItems()}
        </div>
      </Dialog>
    );
  }
};
