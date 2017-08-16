const electron = require('electron');
const {app, BrowserWindow, ipcRenderer} = electron;
const path = require('path');
let userChannel;
require('electron-reload')(__dirname);

app.on('ready', () => {
  let win = new BrowserWindow({width:600,
      height: 200,
      frame: false,
      resizable: true,
      icon: path.join(__dirname,`/build/icon.ico`)});
  win.loadURL(`file://${__dirname}/index.html`);
  win.webContents.openDevTools();
  win.setMenu(null);

  const Youtube = require('youtube-api'),
      fs = require('fs'),
      readJson = require('r-json');

  const CREDENTIALS = readJson(`${__dirname}/credentials.json`);

  let oauth = Youtube.authenticate({
    type: "oauth",
    client_id: CREDENTIALS.web.client_id,
    client_secret: CREDENTIALS.web.client_secret,
    redirect_url: CREDENTIALS.web.redirect_uris[0]
  })

  let url = oauth.generateAuthUrl({
    access_type: "offline",
    response_type: "code",
    scope: ["https://www.googleapis.com/auth/youtube"]
  })

  let authWindow = new BrowserWindow({
    width: 500,
    height: 800,
    show: false,
    'node-integration': false,
    'web-security': false
  });

  let playlistWindow = new BrowserWindow ({
    height: 400,
    width: 150,
    show: false,
    frame: false,
    icon: path.join(__dirname,`/build/icon.ico`)
  });
  
  function getTokens(callback, hideWindow) {
    if(hideWindow != true) { authWindow.show(); }
    authWindow.loadURL(`${url}&pageId=none`);
    authWindow.webContents.on('did-get-redirect-request', function(event, oldUrl, newUrl, isMainFrame) {
      if(newUrl.split("?")[1].split("code=")[1]) {
        authWindow.hide();
        oauth.getToken(newUrl.split("?")[1].split("code=")[1], (err, tokens) => {
          if(err) { throw err };
          oauth.setCredentials(tokens);
          callback(tokens);
        })
      }
    })
  }

  function getUserChannel(callback, tokens) {
    Youtube.channels.list({"part": "id,snippet", "mine": true}, (err, results) => {
      if(err) { throw err };
      let resultObj = {id: results.items[0].id, title: results.items[0].snippet.title, tokens: tokens};
        userChannel = resultObj;
        callback(resultObj);
    })
  }

  function checkTokens(tokens) {
    if(tokens != null) { tokens = JSON.parse(tokens) };
    if(!tokens || parseInt(tokens["expiry_date"]) <= parseInt(new Date().getTime())) {
      return false;
    } else {
      return true;
    }
  }

  module.exports = {
    login: () => {
        getTokens((tokens) => {
          getUserChannel((resultObj) => {
            win.webContents.send('user-channel', resultObj);
            playlistWindow.webContents.send('user-channel', resultObj);
          }, tokens);
        }) 
    },
    addSongToPlaylist: function(songId, playlistId, tokens) {
      let validTokens = checkTokens(tokens);
      if(validTokens) {
        oauth.setCredentials(JSON.parse(tokens));
        addSong();
      } else {
        getTokens((tokens) => {
          console.log("Getting new Token...")
          win.webContents.send('update-tokens', tokens);
          addSong();
        });
      }
      
      function addSong() {
        let data = {"snippet": { "playlistId": playlistId, "resourceId":{ "kind": "youtube#video", "videoId": songId }}};
        Youtube.playlistItems.insert({"part": "snippet", "resource": data});
      }
    },
    openPlaylistWindow: function() {
      playlistWindow.loadURL(`file://${__dirname}/playlists.html`);
      playlistWindow.setMenu(null);
      if(!userChannel) {
        getTokens((tokens) => {
          getUserChannel((resultObj) => {playlistWindow.webContents.send('user-channel', resultObj)}, tokens);
        }, true)
      }
    },
    pickPlaylist: function(id) {
      playlistWindow.hide();
      win.webContents.send('picked-playlist', id);
    }
  }
});