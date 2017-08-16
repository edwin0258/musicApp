const electron = require('electron');
const {ipcRenderer} = electron;
const login = document.getElementById("loginLink");
const userInfo = document.querySelector('.userInfo');
const remote = require('electron').remote;
const main = remote.require('./main.js');
const volume = document.getElementById('volume');
const progress = document.getElementById('progress');
const toggleMusic = document.getElementById('toggleMusic');
const videoToggle = document.getElementById('videoToggle');
const searchToggle = document.getElementById('searchSongs');
const search = document.getElementById('search');
const repeatSong = document.getElementById('repeatSong');
const radio = document.getElementById('radio');
const volumeIcon = document.getElementById('volumeIcon');
const nowPlaying = document.querySelector('.nowPlaying');
const image = document.querySelector('.image');
const close = document.querySelector('.close');
const minimize = document.querySelector('.minimize');
const addSong = document.getElementById('addSong');
const songs = document.querySelector('.songs');
const playlists = document.querySelector('.playlists');
const playlistForm = document.getElementById('playlistForm');
const YTIframeLoader = require('youtube-iframe');
const path = require('path');
const CREDENTIALS = readJson(`${__dirname}/credentials.json`);
const YouTube = require('youtube-node');
const youTube = new YouTube();
let [prev, next] = [document.getElementById("prev"),document.getElementById("next")]
let player, video, toggleEvent, currentPlaylist, currentRadioPL, currentVideo;
let videoNum = 0;
let userVolume = 0;
let videos = [];
let removedVideoCount = 0;
let [repeating, muted, playing, videoHidden, menuVisible, usingRadio, searching] = Array(7).fill(false);
let pls = [
  {id: 'PL9aBrUX8MvU-_sDJEEf09zcZDb7L6OIXJ', name: 'italo'},
  {id: 'PL9aBrUX8MvU_RSYb8hLIFL__Jru-UUUMw', name: 'kpop'},
  {id: 'PL9aBrUX8MvU9YVePHv2zI61ZQevI_IS2z', name: 'International'}];

if(localStorage.getItem('channelId')) {
  login.style.display = "none";
  userInfo.innerText = localStorage.getItem('channelTitle');
  initApp(localStorage.getItem('channelId'));
} else {
  login.addEventListener("click", () => {
    main.login();
  })
}

ipcRenderer.on('user-channel', (e, channel) => {
  localStorage.setItem('channelId', channel.id);
  localStorage.setItem('channelTitle', channel.title);
  localStorage.setItem('userTokens', JSON.stringify(channel.tokens));
  initApp(channel.id);
})

ipcRenderer.on('update-tokens', (e, tokens) => {
  localStorage.setItem('userTokens', JSON.stringify(tokens));
})



function initPlayList(pl, destroy) {
  youTube.addParam('maxResults', 50);
  videos = [];
  videoNum = 0;
  removedVideoCount = 0;
  repeating = false;
  repeatSong.style.color = "#ccc";
  progress.style.width = "0%";
  currentPlaylist = pl;
  initList(songs);
  let currentVideoCount = 0;
  function importVideos(token) {
    youTube.addParam('pageToken', token)
    youTube.getPlayListsItemsById(pl,(err, results) => {
      let totalVideos = results.pageInfo.totalResults;
      results.items.forEach(x => {
        videos.push(x.contentDetails.videoId);
        addListItem(x.snippet.title, songs, 'song');
        currentVideoCount+=1;
      })
      if(currentVideoCount < totalVideos - 1) {
        importVideos(results.nextPageToken);
      } else {
        if(destroy) { player.destroy() };
        loadPlayer();
      }
    })
  }

  if(pl.includes('Radio')) {
    usingRadio = true;
    plIds = pls.reduce((arr, item) => {
      arr.push(item.id);
      return arr;
    }, []);
    currentRadioPL = pls[plIds.indexOf(pl)];
    currentRadioPL.videos.forEach(x => {
      if(x.title) {
        videos.push(x.id);
        addListItem(x.title, songs, 'song');
      } else {
        videos.push(x);
        addListItem(x, songs, 'song');
      }
      currentVideoCount += 1;
    });
    player.destroy();
    loadPlayer();
  } else {
    usingRadio = false;
    importVideos();
  }
}

function loadPlayer() {
  YTIframeLoader.load((YT) => {
    if(videos[videoNum]) {
      currentVideo = videos[videoNum];
      image.style.backgroundImage = `url('https://img.youtube.com/vi/${videos[videoNum]}/0.jpg')`;
    }
    player = new YT.Player('video', {
      height: '150',
      width: '150',
      videoId: videos[videoNum],
      autoplay: true,
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onChange,
        'onError': onError
      }
    })
  })
}

prev.addEventListener('click', prevSong);
next.addEventListener('click', nextSong);

function highlightSong(songNum) {
  let selectedItems = document.querySelectorAll('.selectedItem').forEach(i => i.className = "listItem");
  songs.children[songNum].className += " selectedItem";
}

function prevSong() {
  repeating = false;
  repeatSong.style.color = "#ccc";
  progress.style.width = "0%";
  videoNum -= 1;
  if(videoNum < 0) { videoNum = videos.length - 1 };
  highlightSong(videoNum);
  player.destroy();
  loadPlayer();
}

function nextSong() {
  repeating = false;
  repeatSong.style.color = "#ccc";
  progress.style.width = "0%";
  videoNum += 1;
  if(videoNum > videos.length - 1) {
    if(usingRadio) {
      let max = Math.floor(Math.random() * (21 - 10)) + 10;
      youTube.request(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${max}&relatedToVideoId=${currentVideo}&type=video&key=${CREDENTIALS.web.key}`, (err, msg) => {
        if(err) throw err;
        msg.items.forEach(item => {
          videos.push(item.id.videoId);
          currentRadioPL.videos.push({id: item.id.videoId, title: item.snippet.title});
          addListItem(item.snippet.title, songs, 'song')
        });
        next();
      });
    } else {
      videoNum = 0
      next();
    }
  } else {
    next();
  }
  function next() {
    highlightSong(videoNum);
    player.destroy();
    loadPlayer();
  }
}

function play() {
  toggleMusic.className = "fa fa-pause";
  playing = true;
  player.playVideo();
}

toggleMusic.addEventListener('click', toggle);
function toggle() {
  if(!playing) {
    play();
  } else {
    toggleMusic.className = "fa fa-play";
    playing = false;
    player.pauseVideo();
  }
}

function onPlayerReady() {
  player.setPlaybackQuality('small');
  player.setVolume(userVolume);
  volume.addEventListener("input", changeVolume);
  highlightSong(videoNum);
  function changeVolume(e) {
    player.setVolume(e.target.value)
    userVolume = e.target.value;
    if(e.target.value == 0) {
      volumeIcon.className = "fa fa-volume-off";
    } else if(e.target.value < 25) {
      volumeIcon.className = "fa fa-volume-down";
    } else {
      volumeIcon.className = "fa fa-volume-up";
    }
  }
  nowPlaying.innerText = player.getVideoData().title;
  player.playVideo();
  play();

  video = document.getElementById('video');
  video.style.display = (videoHidden) ? 'none' : 'block';
  videoToggle.removeEventListener('click', toggleVid);
  toggleEvent = videoToggle.addEventListener('click', toggleVid);
}

function toggleVid() {
  if(!videoHidden) {
    video.style.display = 'none';
    videoToggle.className = 'fa fa-eye';
    videoHidden = true;
  } else {
    video.style.display = 'block';
    videoToggle.className = 'fa fa-eye-slash';
    videoHidden = false;
  }
}

let progressTimeout;
function onChange(x) {
  if(x.data == 0) {
    clearTimeout(progressTimeout);
    (repeating) ? player.seekTo(0) : nextSong();
  } else if(x.data == 1) {
    progressTimeout = setTimeout(() => {
      getProgress();
    }, 1000)
    function getProgress() {
      if(player && player.getCurrentTime) {
        progress.style.width = `${((player.getCurrentTime() / player.getDuration()) * 100).toFixed(2)}%`;
      }
      progressTimeout = setTimeout(() => {
        getProgress();
      }, 1000)
    }
  } else {
    clearTimeout(progressTimeout);
  }
}

function onError(x) {
    videos.splice(videoNum, 1);
    songs.children[videoNum].remove()
    removedVideoCount += 1;
    songs.querySelectorAll('.listItem').forEach((li,i) => {
      li.setAttribute('data-num', i);
    })
    highlightSong(videoNum);
    player.destroy();
    loadPlayer();
}

close.addEventListener('click', closeApp);
function closeApp() {
  let win = remote.getCurrentWindow();
  win.close();
}

minimize.addEventListener('click', minimizeApp);
function minimizeApp() {
  let win = remote.getCurrentWindow();
  win.minimize();
}

let openMenu = document.getElementById('openMenu');
let menuClose = document.getElementById('closeMenu');
let menu = document.querySelector('.menu');

openMenu.addEventListener('click', toggleMenu);
closeMenu.addEventListener('click', toggleMenu);
function toggleMenu() {
  if(!menuVisible) {
      menu.className += ' opened';
      menuVisible = true;
      setTimeout(() => {
        let win = remote.getCurrentWindow();
        win.setSize(601,201);
        win.setSize(600,200);
      }, 320)
    } else {
      menu.className = 'menu';
      menuVisible = false;
      setTimeout(() => {
        let win = remote.getCurrentWindow();
        win.setSize(601,201);
        win.setSize(600,200);
      }, 320)
    }
}

function initList(list) {
  while(list.firstChild) {list.removeChild(list.firstChild)}
}

function addListItem(item, list, type) {
  let li = document.createElement('li');
  li.className = 'listItem';
  if(type == 'song') {
    li.appendChild(document.createTextNode(item));
    li.addEventListener('click', chooseSong);
    li.setAttribute('data-num', list.children.length);
  } else if(type == 'playlist') {
    li.appendChild(document.createTextNode(item.name));
    li.addEventListener('click', () => {initPlayList(item.id, true)});
  }
  list.appendChild(li);
}

function chooseSong(e) {
  let num = e.target.dataset.num;
  videoNum = +num;
  repeating = false;
  repeatSong.style.color = "#ccc";
  highlightSong(num);
  player.destroy();
  loadPlayer();
}

repeatSong.addEventListener('click', toggleRepeat) ;
function toggleRepeat(){
  if(!repeating) {
    repeating = true;
    repeatSong.style.color = "green";
  } else {
    repeating = false;
    repeatSong.style.color = "#ccc";
  }
}

volumeIcon.addEventListener('click', toggleMuted);
function toggleMuted() {
  if(!muted) {
    muted = true;
    volume.value = 0;
    player.setVolume(0);
    volumeIcon.className = "fa fa-volume-off";
  } else {
    muted = false;
    volume.value = userVolume;
    player.setVolume(userVolume);
    if(userVolume < 25) {
      volumeIcon.className = "fa fa-volume-down";
    } else {
      volumeIcon.className = "fa fa-volume-up";
    }
  }
}

playlistForm.addEventListener('submit', addPlayList);
let playlistName = document.getElementById('playlistName');
let playlistId = document.getElementById('playlistId');
function addPlayList(e) {
  e.preventDefault();
  addListItem({id: playlistId.value, name: playlistName.value}, playlists, 'playlist');
  playlistName.value = '';
  playlistId.value = '';
}

let progressClickable = document.querySelector('.shadow');
progressClickable.addEventListener('click', changeTime);
function changeTime(e) {
  let newWidth = ((e.pageX - 10) / progressClickable.offsetWidth);
  progress.style.width = `${newWidth.toFixed(2) * 100}%`;
  player.seekTo(player.getDuration() * newWidth);
  clearTimeout(progressTimeout);
}

addSong.addEventListener('click', openPlaylistWindow);
function openPlaylistWindow() {
  main.openPlaylistWindow();
}

ipcRenderer.on('picked-playlist', (e, id) => {
  main.addSongToPlaylist(currentVideo, id, localStorage.getItem("userTokens"));
})

radio.addEventListener('click', startRadio);
function startRadio() {
  pls.push({id: `${currentVideo}Radio`, name: `${currentVideo}Radio`, videos: [currentVideo]});
  addListItem({id: `${currentVideo}Radio`, name: `${currentVideo}Radio`}, playlists, 'playlist');
  initPlayList(`${currentVideo}Radio`);
}

searchToggle.addEventListener('click', toggleSearching)
function toggleSearching() {
  if(searching) {
    songs.className = "songs";
    search.style.display = "none";
    searchToggle.style.color = "#ccc";
    searching = false;
    Array.prototype.forEach.call(songs.children, song => song.style.display = "block");
  } else {
    songs.className += " songsSearching";
    search.style.display = "block";
    search.focus();
    searchToggle.style.color = "green";
    searching = true;
  }
}

search.addEventListener('input', filterSongs);

function filterSongs(e) {
  if(searching) {
    Array.prototype.forEach.call(songs.children, song => {
      if(!song.innerText.toLowerCase().match(e.target.value.toLowerCase())) {
        song.style.display = "none";
      } else {
        song.style.display = "block";
      }
    })
  }
}

document.body.addEventListener('keydown', (e) => {
  if(document.activeElement.tagName.toLowerCase() != "input") {
    if(e.keyCode == 32) { toggle(); };
    if(e.keyCode == 77) { toggleMuted(); };
  }
});

function initApp(userChannel) {
  youTube.setKey(CREDENTIALS.web.key);
  youTube.request(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${userChannel}&key=${CREDENTIALS.web.key}&maxResults=50`, (err, results) => {
    results.items.forEach(item => {
      let existing = false;
      pls.forEach(pl => {
        if(pl.id == item.id) { existing = true };
      })
      if(!existing) { pls.push({id: item.id, name: item.snippet.localized.title}) };
    })
    pls.sort((a, b) => {
      let x = a.name.toLowerCase();
      let y = b.name.toLowerCase();
      if(x < y) { return -1 }
      if(x > y) { return 1 }
      return 0;
    }).forEach(pl => {addListItem(pl, playlists, 'playlist')});
    initPlayList(pls[0].id);
  })
}