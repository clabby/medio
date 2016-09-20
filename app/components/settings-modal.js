import React from 'react';

import { dispatch } from '../lib/dispatcher';
import { Dialog, RaisedButton, Checkbox } from 'material-ui';

import _ from 'lodash';

module.exports = class SettingsModal extends React.Component {
  render () {
    return (
      <Dialog
        modal={false}
        open={true}
        onRequestClose={() => dispatch('exitModal')}
        autoScrollBodyContent={true}
        className='settings-modal'
        title='Settings'
      >
        <div style={{display: 'block', marginTop: '25px'}}>
          <i className='icon close' onClick={() => dispatch('exitModal')}>close</i>
          <Checkbox label='Show torrent loading in progress bar' checked={state.settings.get('showTorrentProgress', true)} onCheck={(e, isChecked) => dispatch('setSetting', 'showTorrentProgress', isChecked)} />
        </div>
      </Dialog>
    );
  }
};
