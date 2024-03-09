var redirect_uri = "http://localhost:5500/AuthAndUseSpotifyAPI/frontPage.html";
//must make public to rest of script so everyting can refrence it for future use
var client_id = ""; 
var client_secret = "";

var access_token = null;
var refresh_token = null;

var PlayerId = null;

const PERMISSIONS = "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private user-top-read";

const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";
const GETTOPSONGS = "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=20"
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const PLAYSONG  = "https://api.spotify.com/v1/me/player/play";
const GETCURRENTPLAYER = "https://api.spotify.com/v1/me/player";
const GETDEVICES = "https://api.spotify.com/v1/me/player/devices";
const PAUSE = 'https://api.spotify.com/v1/me/player/pause';

function onPageLoad() //determians if user has been rederected or not on startup
{
    //everytime page loads must retrieve the client id and client secret just cuz
    client_id = localStorage.getItem("client_id");
    client_secret = localStorage.getItem("client_secret");
    PlayerId = localStorage.getItem("PlayerId");


    if(window.location.search.length > 0) // if we did get the autho code already
    {
        handleRedirect();
    }
}

function handleRedirect()
{
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("","", redirect_uri); //remove param from url so you have a clean url everytime page refreshes
}

function fetchAccessToken(code) //creates another url to spotify to get an access token
{
    //url needs the code recieved through user permission, client id, and client secret
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function refreshAccessToken()
{
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body) //idk what this does
{
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse()
{
    if(this.status == 200) //checks if succsess
    {
        var data = JSON.parse(this.responseText); 
        console.log(data); //for debug purpouses
        var data = JSON.parse(this.responseText);
        if(data.access_token != undefined)
        {
            access_token = data.access_token; //if we got an access token
            localStorage.setItem("access_token", access_token); //if so save it in local storage
        }
        if(data.refresh_token != undefined)
        {
            refresh_token = data.refresh_token; //if got refresh token 
            localStorage.setItem("refresh_token", refresh_token); //if so save refresh token in local storage
        }
        onPageLoad();
    }
    else //if not display the error
    {
        console.log(this.responseText);
        alert(this.responseText);
    }
}


function getCode() //gets the code seperated from rest of the url 
{
    let code = null;
    const queryString = window.location.search;
    if(queryString.length > 0) //checks if there is data inputed 
    {
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code');
    }
    return code;
}

function requestAuthorization()
{
    client_id = document.getElementById("clientId").value;
    client_secret = document.getElementById("clientSecret").value;
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret); //in real app you should not expose your client_secret to the user
    

    //constructing request author link
    let url = AUTHORIZE; // client id
    url += "?client_id=" + client_id; 
    url += "&response_type=code"; 
    url += "&redirect_uri=" + encodeURI(redirect_uri) //redirect uri
    url += "&show_dialog=true"; //optional, will always display spotify dialog, so does not save the authication for dev purposes, set to false for final release
    url += PERMISSIONS;
    //^scope of permisions that we are asking for, can be longer or shorter depending on what permissions are needed
    /*
    url is asking for the following permissions
        1.get user email
        2.modify playback state
        3.play back position
        4.read user libraries
        4.streaming access?
        5.read playback state
        6.read recently played
        7.read private
        8.reads top songs
    */  
    window.location.href = url; //show spotify's authorization screen
}

function getTopSongs()
{
    callApi("GET", GETTOPSONGS, null, handleTopSongs);
}

function GetRandomSongFromPlaylists()
{
    callApi("GET", PLAYLISTS, null, HandleRandomSongFromPlaylists);
}

function callApi(method, url, body, callback)
{
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

function GetCurrentPlayer()
{
    callApi("GET", GETCURRENTPLAYER, null, handlePlayer);
}

function handlePlayer()
{
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        if(data.device && data.device.id)
        {
            console.log(data.device.name + " id is: " + data.device.id);
            PlayerId = data.device.id;
            localStorage.setItem("PlayerId", PlayerId);

        }    
    }
    else if ( this.status == 401 ){
        refreshAccessToken();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function play(playlistId, songInPlaylist){
    let playlist_id = playlistId;
    let trackindex = songInPlaylist;
    GetCurrentPlayer();
    let album = "";
    let body = {};
    if ( album.length > 0 ){
        body.context_uri = album;
    }
    else{
        body.context_uri = "spotify:playlist:" + playlist_id;
    }
    body.offset = {};
    body.offset.position = trackindex//.length > 0 ? Number(trackindex) : 0;
    body.offset.position_ms = 0;
    callApi( "PUT", PLAYSONG + "?device_id=" + PlayerId, JSON.stringify(body), handleApiResponse );
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

function HandleRandomSongFromPlaylists()
{
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        const playListNumber = getRandomInt(0,data.items.length)
        console.log(data.items[playListNumber].name + " " + data.items[playListNumber].tracks.total);
        const playlistLength = data.items[playListNumber].tracks.total;
        const playlistId = data.items[playListNumber].id;
        const songNumber = getRandomInt(0,playlistLength);
        play(playlistId, songNumber);

    }
    else if ( this.status == 401 ){
        refreshAccessToken();
    }
    else { 
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handleTopSongs()
{
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        data.items.forEach(item => console.log("Song=" + item.name));
        
    }
    else if ( this.status == 401 ){
        refreshAccessToken();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function testPlayer()
{
    console.log(PlayerId);
}

function handleApiResponse(){
    if ( this.status == 200){
        console.log(this.responseText);
    }
    else if ( this.status == 204 ){
        //setTimeout(currentlyPlaying, 2000);
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }    
}

function GetDevices()
{
    callApi("GET", GETDEVICES, null, handleDevices)
}

function handleDevices()
{
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        data.devices.forEach(item => console.log("Device " + item.name + " is active: " + item.is_active));
        console.log(data);
    }
    else if ( this.status == 401 ){
        refreshAccessToken();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function pauseSong()
{
    GetCurrentPlayer();
    callApi("PUT", PAUSE + "?device_id=" + PlayerId, null, handleDevices);
};
