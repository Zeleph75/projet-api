import {AUTH_URL} from "../utils/auth.js";
import React from "react";
import { StrictMode } from "react";

const LoginButton = () => {
    return (
        <button onClick={() => (window.location.href = AUTH_URL)} className="bg-green-500 text-white px-4 py-2 rounded">
            Se connecter avec Spotify
        </button>
    );
};

export default LoginButton;
