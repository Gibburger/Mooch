var redirect_uri = "http://localhost:5500/AuthAndUseSpotifyAPI/frontPage.html";
var client_id = "";
var client_secret = "";

const AUTHORIZE = "https://accounts.spotify.com/authorize"

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
    url += "&scope=user-read-private-user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private"
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
    */
    window.location.href = url; //show spotify's authorization screen
}