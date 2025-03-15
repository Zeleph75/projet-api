import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import React from "react";

const CurrentTrack2 = ({ currentUser, users, salons }) => {
    const token = useAuthStore((state) => state.token);
    const [track, setTrack] = useState(null);
    const [sharedTrack, setSharedTrack] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const devicesRef = useRef([]);
    const [isFetching, setIsFetching] = useState(false);

    // Vérifier si l'utilisateur est admin du salon
    const userSalon = salons.find(salon => salon.name === currentUser?.group);
    const isAdmin = userSalon?.roles?.[currentUser?.email] === "admin";

    useEffect(() => {
        if (!token) return;

        const fetchDevices = async () => {
            try {
                const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) throw new Error("Erreur lors de la récupération des appareils");

                const data = await response.json();
                devicesRef.current = data.devices || [];
            } catch (error) {
                console.error("Erreur lors de la récupération des appareils :", error);
            }
        };

        const fetchCurrentTrack = async () => {
            if (isFetching) return;
            setIsFetching(true);

            try {
                const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.status === 204) {
                    setTrack(null);
                } else {
                    const data = await response.json();
                    if (data?.item) {
                        const currentTrack = {
                            id: data.item.id,
                            name: data.item.name,
                            artists: data.item.artists.map((artist) => artist.name).join(", "),
                            album: data.item.album.name,
                            image: data.item.album.images[0]?.url,
                            progress: data.progress_ms,
                        };

                        setTrack(currentTrack);

                        // Si l'admin partage sa musique, mettre à jour la musique partagée globalement
                        if (isAdmin && isSharing) {
                            setSharedTrack(currentTrack);
                            localStorage.setItem("sharedTrack", JSON.stringify(currentTrack)); // Stocker globalement
                        }
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

        const interval = setInterval(fetchCurrentTrack, 5000);
        return () => clearInterval(interval);
    }, [token, isSharing]);

    // Récupérer la musique partagée si l'utilisateur n'est pas admin
    useEffect(() => {
        if (!isAdmin) {
            const storedTrack = localStorage.getItem("sharedTrack");
            if (storedTrack) {
                setSharedTrack(JSON.parse(storedTrack));
            }
        }
    }, [isAdmin]);

    return (
        <div className="p-4 bg-gray-700 rounded-md flex flex-col gap-3 w-72">
            {isAdmin && (
                <button
                    onClick={() => {
                        if (isSharing) {
                            setSharedTrack(null);
                            localStorage.removeItem("sharedTrack"); // Supprimer la musique partagée
                        }
                        setIsSharing(!isSharing);
                    }}
                    className={`px-3 py-1 rounded-md text-xs ${
                        isSharing ? "bg-red-500" : "bg-blue-500"
                    } text-white`}
                >
                    {isSharing ? "🛑 Arrêter le partage" : "📢 Partager ma musique"}
                </button>
            )}

            {/* L'admin voit la musique partagée quand il la partage */}
            {isAdmin && isSharing && sharedTrack && (
                <div className="p-3 bg-gray-800 rounded-md flex items-center gap-2 border border-yellow-500">
                    <img src={sharedTrack.image} alt={sharedTrack.album} className="rounded-md" style={{ width: "50%" }} />
                    <div className="text-white text-xs leading-tight">
                        <h3 className="text-lg font-bold">{sharedTrack.name}</h3>
                        <p className="text-sm">{sharedTrack.artists}</p>
                        <p className="text-xs text-gray-300">{sharedTrack.album}</p>
                    </div>
                </div>
            )}

            {/* Les utilisateurs du groupe voient la musique partagée */}
            {!isAdmin && sharedTrack && (
                <div className="p-3 bg-gray-800 rounded-md flex items-center gap-2 border border-green-500">
                    <img src={sharedTrack.image} alt={sharedTrack.album} className="rounded-md" style={{ width: "50%" }} />
                    <div className="text-white text-xs leading-tight">
                        <h3 className="text-lg font-bold">{sharedTrack.name}</h3>
                        <p className="text-sm">{sharedTrack.artists}</p>
                        <p className="text-xs text-gray-300">{sharedTrack.album}</p>
                    </div>
                </div>
            )}

            {/* Afficher la musique en cours SEULEMENT si elle n'est pas partagée */}
            {track && (!isAdmin || !isSharing) && (
                <div className="p-3 bg-gray-900 rounded-md flex items-center gap-2">
                    <img src={track.image} alt={track.album} className="rounded-md" style={{ width: "50%" }} />
                    <div className="text-white text-xs leading-tight">
                        <h3 className="text-lg font-bold">{track.name}</h3>
                        <p className="text-sm">{track.artists}</p>
                        <p className="text-xs text-gray-300">{track.album}</p>
                    </div>
                </div>
            )}

            {/* Si aucun morceau n'est en cours de lecture */}
            {!track && !sharedTrack && <p className="text-gray-400 text-center">Aucune musique en cours</p>}
        </div>
    );
};

export default CurrentTrack2;
