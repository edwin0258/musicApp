const electron = require('electron');
const {ipcRenderer, remote} = electron;
const playlists = document.querySelector('.playlists');
const close = document.querySelector('.close');
const path = require('path');
const CREDENTIALS = readJson(`${__dirname}/credentials.json`);
let pls = [];
let YouTube = require('youtube-node');
let youTube = new YouTube();
let win = remote.getCurrentWindow();

ipcRenderer.on('user-channel', (event, userChannel) => {
  if(!localStorage.getItem('channelId')) {
    initList(userChannel.id);
  }
})

if(localStorage.getItem('channelId')) {
  initList(localStorage.getItem('channelId'));
}

function initList(channel) {
  youTube.request(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channel}&key=${CREDENTIALS.web.key}&maxResults=50`, (err, results) => {
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
  })

  function addListItem(item, list, type) {
    let li = document.createElement('li');
    li.className = 'listItem';
    if(type == 'song') {
      li.appendChild(document.createTextNode(item));
      li.addEventListener('click', chooseSong);
      li.setAttribute('data-num', list.children.length);
    } else if(type == 'playlist') {
      li.appendChild(document.createTextNode(item.name));
      li.addEventListener('click', () => { pickPlaylist(item.id) });
    }
    list.appendChild(li);
    win.show();
  }

  function pickPlaylist(id) {
    const main = remote.require('./main.js');
    main.pickPlaylist(id);
  }
}

close.addEventListener('click', closeApp);
function closeApp() {
  win.hide();
}