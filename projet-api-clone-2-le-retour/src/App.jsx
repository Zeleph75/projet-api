import React from "react";
import { StrictMode } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginButton from "./components/LoginButton";
import Callback from "./pages/Callback";
import UserProfile from "./components/UserProfile";
import CurrentTrack from "./components/CurrentTrack";
import { useAuthStore } from "./store/authStore";

const App = () => {
    const token = useAuthStore((state) => state.token);

    return (
        <Router>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white p-4">
                <h1 className="text-3xl font-bold mb-4">Spotify Auth</h1>
                {token ? (
                    <>
                        <UserProfile />
                        <CurrentTrack />
                    </>
                ) : (
                    <LoginButton />
                )}
                <Routes>
                    <Route path="/callback" element={<Callback />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
