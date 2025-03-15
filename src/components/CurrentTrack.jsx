import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import React from "react";

const CurrentTrack = () => {
    const token = useAuthStore((state) => state.token);
    const [track, setTrack] = useState(null);
    const devicesRef = useRef([]);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (!token) return;

        const fetchDevices = async () => {
            try {
                const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await response.json();
                if (JSON.stringify(devicesRef.current) !== JSON.stringify(data.devices)) {
                    devicesRef.current = data.devices || [];
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des appareils :", error);
            }
        };

        const fetchCurrentTrack = async () => {
            if (isFetching || devicesRef.current.length === 0) return;

            setIsFetching(true);

            try {
                const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.status === 204) {
                    setTrack(null);
                } else {
                    const data = await response.json();
                    if (data && data.item) {
                        setTrack({
                            name: data.item.name,
                            artists: data.item.artists.map((artist) => artist.name).join(", "),
                            album: data.item.album.name,
                            image: data.item.album.images[0]?.url,
                        });
                    }
                }
            } catch (error) {
                console.error("Erreur lors de la récupération du morceau :", error);
            } finally {
                setIsFetching(false);
            }
        };

        fetchDevices();
        fetchCurrentTrack();

        const interval = setInterval(fetchCurrentTrack, 3000); // ⏳ Mise à jour toutes les 5s
        return () => clearInterval(interval);
    }, [token]); // 🔥 Suppression de `devices` des dépendances

    if (!track) {
        return <p className="text-gray-400">Aucune musique en cours</p>;
    }

    return (
        <div className="p-4 bg-gray-700 rounded-md flex items-center gap-2 w-64">
            <img src={track.image} alt={track.album} className="w-10 h-10 rounded-md"  style={{ width: "50%" }}/>
            <div className="text-white text-xs leading-tight">
                <h3 className="text-lg font-bold text-dark">{track.name}</h3>
                <p className="text-sm text-dark">{track.artists}</p>
                <p className="text-xs text-dark">{track.album}</p>
            </div>
        </div>
    );
};

export default CurrentTrack;
