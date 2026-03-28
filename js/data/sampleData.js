const sampleSongs = [];

const sampleArtists = [];

const sampleAlbums = [];

const sampleCategories = [
  { id: 'all', name: '全部', icon: '🎵' },
  { id: 'pop', name: '流行', icon: '🎤' },
  { id: 'rock', name: '摇滚', icon: '🎸' },
  { id: 'classical', name: '古典', icon: '🎻' },
  { id: 'jazz', name: '爵士', icon: '🎷' },
  { id: 'electronic', name: '电子', icon: '🎧' }
];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getSongsByCategory(category) {
  if (category === 'all') {
    return sampleSongs;
  }
  return sampleSongs.filter(song => song.genre === category);
}

function searchSongs(query) {
  const lowerQuery = query.toLowerCase();
  return sampleSongs.filter(song =>
    song.title.toLowerCase().includes(lowerQuery) ||
    song.artist.toLowerCase().includes(lowerQuery) ||
    song.album.toLowerCase().includes(lowerQuery)
  );
}

function getSongById(id) {
  return sampleSongs.find(song => song.id === id);
}

function getRandomSongs(count = 10) {
  const shuffled = [...sampleSongs].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sampleSongs,
    sampleArtists,
    sampleAlbums,
    sampleCategories,
    formatTime,
    getSongsByCategory,
    searchSongs,
    getSongById,
    getRandomSongs
  };
}