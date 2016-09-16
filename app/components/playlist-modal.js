import React from 'react';

import { dispatch } from '../lib/dispatcher';
import { Dialog, RaisedButton, List, ListItem } from 'material-ui';
import Trash from 'material-ui/svg-icons/action/delete';

import _ from 'lodash';

module.exports = class PlaylistModal extends React.Component {
  getPlaylistItems () {
    const state = this.props.state;
    var entries = [];

    if (state.playlist.entries.length < 1) {
      entries.push(
        <ListItem primaryText={'Playlist is empty!'} key='nothing' style={{textAlign: 'center'}} />
      );
    } else {
      entries = _.map(state.playlist.entries, function (entry) {
        return (
          <ListItem primaryText={entry.name} onClick={() => dispatch('select', entry)} key={entry.id} className={'playlist-entry ' + (state.playlist.selected.id === entry.id ? 'selected' : '')} rightIcon={<i className='icon' onClick={(e) => {
            e.stopPropagation();
            dispatch('deleteFromPlaylist', entry.id);
          }}>delete</i>} />
        );
      });
    }
    return entries;
  }

  render () {
    const state = this.props.state;

    const actions = [
      (
        <RaisedButton
          label='ADD FILE(S)'
          primary={true}
          onTouchTap={() => dispatch('openFileSelect')}
          style={{display: 'block'}}
        />
      )
    ]

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
