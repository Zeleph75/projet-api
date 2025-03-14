import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import React from "react";
import { StrictMode } from "react";

const UserProfile = () => {
    const token = useAuthStore((state) => state.token);
    const setUser = useAuthStore((state) => state.setUser);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        const fetchProfile = async () => {
            const response = await fetch("https://api.spotify.com/v1/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setUser(data);
            setLoading(false);
        };

        fetchProfile();
    }, [token, setUser]);

    const user = useAuthStore((state) => state.user);

    if (loading) return <p>Chargement...</p>;
    if (!user) return <p>Erreur de récupération du profil.</p>;

    return (
        <div className="p-4 bg-gray-900 text-white rounded-lg">
            <img src={user.images?.[0]?.url} alt="Profile" className="w-16 h-16 rounded-full" />
            <h2 className="text-xl font-bold">{user.display_name}</h2>
            <p>{user.email}</p>
        </div>
    );
};

export default UserProfile;
