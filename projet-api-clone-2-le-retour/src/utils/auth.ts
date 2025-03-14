const CLIENT_ID = "d54d4a56ed83457183ceba238ab3a952";
const CLIENT_SECRET = "ae686584b09c4a1cb3f6ae94e094d82c";
const REDIRECT_URI = "http://localhost:3000/callback";
const SCOPES = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "user-read-currently-playing",
    "user-read-playback-state",
].join("%20");

export const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
)}&scope=${SCOPES}`;

export const exchangeToken = async (code: string) => {
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(CLIENT_ID + ":" + CLIENT_SECRET)}`,
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
        }),
    });

    return response.json();
};
