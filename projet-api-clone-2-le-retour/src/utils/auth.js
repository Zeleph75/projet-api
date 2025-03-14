const CLIENT_ID = "ab068ab78494424ab096c6ecd4e4a9f0";
const CLIENT_SECRET = "4de9e26299cc4ad4863bb72591426a9b";
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

export const exchangeToken = async (code) => {
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
