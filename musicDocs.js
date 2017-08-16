/* Documentation for music.js */
/* 
initApp
    This request will get the first 50 playlists from a channel (a.k.a user).
    - For each playlist, if it already exists in the logged playlists then don't add it.
    - push playlist if unique to pls array.
    - Sort pls by name.
    - When the app is opened the first playlist in pls will be loaded.

initPlayList
    - When a new playlist is reloaded reset the variables that are associated with an individual playList.
    - Init the songs list (remove all of its children).
    - Run a recursive function called importVideos. This will call the youTube method `getPlayListsItemsById getting all of the songs on a page.
    Since playlists can be longer than 50 songs to get next pages of songs in a playlist the function is called again with the nextPageToken
    if not all of the songs have been retrieved.
    - For each page, each songs id is pushed to the videos array and the song title is added to the songs list.
    - That is if the playlist is a real youtube playlist. The app can also make radio playlists. You can tell that a playlist is a radio playlist because its id will not be a youtube id but instead the video id that created it along with the term 'radio' attached to the end of it.
    - For radio playlists, set the usingRadio variable to true. Get the videos of the playlist and loop through them pushing all of them to the videos array. Add each song to the songs list.

loadPlayer
    - using the youtube-iframe package a new iframe is loaded. If an image exists than add that as a background so that when user hides the iframe they
    will still have an image representation.
    - The iframe is 150x150 and is given some events and properties.

highlightSong
    - removes highlighting from all songs if they have been highlighted.
    - highlights a song in the songs list (probably the currently playing song).

prevSong
    - The current videoNum is subtracted by one.
    - If it is below 0 then set it to the length of the videos array minus 1.
    - highlight the videoNum child in the songs list with green.
    - destroy the play holding the last song and make a player for the new song.

nextSong
    - Same logic as prevSong expect when the playlist is a radio playlist.
    - If it is a radio playlist and there are no more videos, instead of starting back at the first video in the playlist a request for more videos releated to the last video in the playlist will be made. The videos returned from this request are then pushed onto videos array, added to the pls playlists videos array, and added to the songs list. Once all of the videos have been added the next song is played.

play
    - play current video in player.
    - change play icon to pause icon.

toggle
    - If the video is not playing then play it.
    - If the video is playing then stop it.

onPlayerReady
    - When the player has loaded properly then set the player volume to the current user volume.
    - Reconnect the volume range input with the new video.
    - Highlight the current song in the songs list.
    - when the volume is changed it calls the changeVolume function which sets the new volume and icon of the volume icon.
    - Starts the loaded video and changed the nowPlaying text.
    - Resets the event listener that toggles the image and iframe.

toggleVid
    -When the eye icon is clicked it will toggle the iframe and an image representation of it.

onChange
    - When a video ends this will either repeat if repeating is true or it will call for the next song to be played.
    - When a video has ended the progressTimeout is cleared.
    - IF the video has started playing then the progressTimeout is set.
    - The progress function will get the current time of the player and the total duration and calculate the new width the the progress bar that will be set. This gives the user a visualization of the progress the video has made along its duration.
    - If the video has stopped or something else has happened then clear the progressTimeout.

onError
    - If there is an error with the video it will remove that video from the playlsit queue and skip to the next song.

toggleMenu
    - Toggles the menu with additional options.
    - In order to redraw the app so that the items on this menu can be manipulated a setTimeout is called that quickly changes the windows width and hight
    which forces the app to redraw. This is done for both when it is opened and when it is closed.

initList
    - Removes all children of a list.

addListItem
    - Adds an item to a list. Depending on the type it adds different things.
    - If a song is being added then give it a data-num so that when it is clicked the correct song is loaded for playing.
    - If it is a playlist then add the name to the playlists list and give it an onclick that will takes its id to load the correct playlist.

chooseSong
    - When a song is clicked load the correct song given its data-num property.
    - toggle the repeating off if it was on.
    - Highlight the selected song in the songs list
    - Destroy the player holding the previous song and load a new one with current song.

toggleRepeat
    - Toggles if a song will be repeated when it ends or not.

toggleMuted
    - When clicked and muted is false it will set the volume to 0 and set the volume icon to off.
    - When clicked and muted is true it will set the volume back to the last volume that user selected.

addPlayList 
    - When the playlistForm is submitted this will add the user specified playlist to the playlists list for selecting.
    - Will then reset the fields in the form.

changeTime
    - When a user clicks anywhere on the progress bar it will get the position of the mouse and calculate the time that the current video should be set to. So if the user clicks at the end of the progress bar the video time will be then placed near the end of its duration.
    - It also clears the progressTimeout just incase setting to a new time creates another timeout (not sure if this is actually needed).

openPlaylistWindow
    - Calls the main.openPlaylistWindow function which will open the users playlists so that they can add a video to one of them.

startRadio
    - When the startRadio button is pressed the currentVideo will be used to make a radio playlist. The playlist will be added to the pls array. Each new radio playlist has an id of the currentVideos id and 'radio' appended to it. Each new radio playlist also has an additional key of videos which will save all of the videos that are added to the playlist so that they can be retrieved later.
    - The playlist is added to the playlists list and the playlist is started.
    - Since there will only be one video when the playlist is started it will be the same video that the user pressed the startRadio button from.
*/