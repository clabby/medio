module.exports = {
  formatTime,
  getTorrentProgressSummary
};

function formatTime (secs) {
  var hours = (secs / 3600) | 0;
  var mins = ((secs - hours * 3600) / 60) | 0;
  secs = (secs - (3600 * hours + 60 * mins)) | 0;
  if (mins < 10) mins = '0' + mins;
  if (secs < 10) secs = '0' + secs;
  return (hours ? hours + ':' : '') + mins + ':' + secs;
};

function getTorrentProgressSummary (torrent) {
  const fileProg = torrent.files && torrent.files.map(function (file) {
    const totalPieces = file._endPiece - file._startPiece + 1;
    let totalPiecesPresent = 0;
    for (let piece = file._startPiece; piece <= file._endPiece; piece++) {
      if (torrent.bitfield.get(piece)) totalPiecesPresent++
    }
    return {
      startPiece: file._startPiece,
      endPiece: file._endPiece,
      totalPieces,
      totalPiecesPresent
    }
  });
  return {
    torrentKey: torrent.key,
    ready: torrent.ready,
    progress: torrent.progress,
    length: torrent.length,
    bitfield: torrent.bitfield,
    files: fileProg
  };
}
