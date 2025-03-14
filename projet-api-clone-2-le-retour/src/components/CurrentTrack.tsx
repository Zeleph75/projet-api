import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";

interface TrackInfo {
    name: string;
    artists: string;
    album: string;
    image: string;
}

const CurrentTrack = () => {
    const token = useAuthStore((state) => state.token);
    const [track, setTrack] = useState<TrackInfo | null>(null);

    useEffect(() => {
        if (!token) return;

        const fetchCurrentTrack = async () => {
                const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 204) {
                setTrack(null);
                return;
            }

            const data = await response.json();
            if (data && data.item) {
                setTrack({
                    name: data.item.name,
                    artists: data.item.artists.map((artist: any) => artist.name).join(", "),
                    album: data.item.album.name,
                    image: data.item.album.images[0]?.url,
                });
            }
        };

        fetchCurrentTrack();
        const interval = setInterval(fetchCurrentTrack, 1); // Mise à jour toutes les 1s

        return () => clearInterval(interval);
    }, [token]);

    if (!track) {
        return <p className="text-gray-400">Aucune musique en cours</p>;
    }

    return (
        <div className="p-4 bg-gray-700 rounded-md flex items-center gap-2 w64">
            <img src={track.image} alt={track.album} className="w-10 h-10 rounded-md" />
            <div className="text-white text-xs leading-tight">
                <h3 className="text-lg font-bold">{track.name}</h3>
                <p className="text-sm">{track.artists}</p>
                <p className="text-xs text-gray-300">{track.album}</p>
            </div>
        </div>
    );
};

export default CurrentTrack;
