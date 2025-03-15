import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../store/authStore";
import UserProfile from "../components/UserProfile";
import CurrentTrack from "../components/CurrentTrack";
import CurrentTrack2 from "../components/CurrentTrack2"; // 🔥 Nouveau composant ajouté
import { AUTH_URL } from "../utils/auth.js";

import "./ListeGroupe.css";

export default function TestPage() {
    const [groupName, setGroupName] = useState("");
    const [users, setUsers] = useState([]);
    const [showGroups, setShowGroups] = useState(true);
    const [salons, setSalons] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        // 🔹 Vérifier si un token Spotify est présent dans l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const spotifyTokenFromURL = urlParams.get("spotify_token");

        if (spotifyTokenFromURL) {
            localStorage.setItem("spotify_token", spotifyTokenFromURL);

            // 🔹 Nettoyer l'URL après stockage
            navigate("/test", { replace: true });
        }

        const localToken = localStorage.getItem("token");

        if (!localToken) {
            navigate("/");
            return;
        }

        try {
            const decoded = jwtDecode(localToken);
            if (!decoded.email) throw new Error("Email non valide dans le token");

            const userEmail = decoded.email;

            const fetchData = () => {
                fetch("http://localhost:5000/data", {
                    headers: { Authorization: `Bearer ${localToken}` },
                })
                    .then(response => {
                        if (!response.ok) throw new Error("Erreur d'authentification");
                        return response.json();
                    })
                    .then(data => {
                        setUsers(data.users || []);
                        setSalons(data.salons || []);

                        const loggedInUser = data.users.find(user => user.email === userEmail) || null;
                        if (!loggedInUser) {
                            handleLogout();
                            return;
                        }

                        setCurrentUser(loggedInUser);
                        setGroupName(loggedInUser.group || "");

                        const userWithSpotifyToken = data.users.find(user => user.email === userEmail && user.accessToken);
                        if (userWithSpotifyToken && !localStorage.getItem("spotify_token")) {
                            localStorage.setItem("spotify_token", userWithSpotifyToken.accessToken);
                        }
                    })
                    .catch(error => {
                        console.error("Erreur lors de la récupération des données:", error);
                        handleLogout();
                    });
            };

            fetchData();
            const interval = setInterval(fetchData, 1000);

            return () => clearInterval(interval);
        } catch (error) {
            console.error("Token invalide ou expiré :", error);
            handleLogout();
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("spotify_token");
        navigate("/");
    };

    const handleSpotifyLogin = () => {
        window.location.href = AUTH_URL;
    };

    const handleSpotifyLogout = () => {
        localStorage.removeItem("spotify_token");
        window.location.reload(); // Rafraîchir la page après la déconnexion
    };

    const handleJoinGroup = async () => {
        if (!currentUser) return alert("Aucun utilisateur connecté");

        const name = prompt("Entrez le nom du groupe :");
        if (!name) return;

        const updatedUsers = users.map(user =>
            user.email === currentUser.email ? { ...user, group: name } : user
        );
        setUsers(updatedUsers);
        setGroupName(name);

        const updatedSalons = salons.map(salon => {
            if (salon.members.includes(currentUser.email)) {
                salon.members = salon.members.filter(member => member !== currentUser.email);
            }
            return salon;
        });

        const salonIndex = updatedSalons.findIndex(salon => salon.name === name);
        if (salonIndex !== -1) {
            if (!updatedSalons[salonIndex].members.includes(currentUser.email)) {
                updatedSalons[salonIndex].members.push(currentUser.email);
            }
        } else {
            updatedSalons.push({
                name,
                members: [currentUser.email],
                roles: { [currentUser.email]: "admin" }
            });
        }

        const cleanedSalons = updatedSalons.filter(salon => salon.members.length > 0);
        setSalons(cleanedSalons);

        try {
            const token = localStorage.getItem("token");

            await fetch("http://localhost:5000/update-group", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ users: updatedUsers })
            });

            await fetch("http://localhost:5000/update-salons", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ salons: cleanedSalons })
            });

            console.log("Mise à jour réussie !");
        } catch (error) {
            console.error("Erreur lors de la mise à jour :", error);
        }
    };

    const getUsersInSameGroup = () => {
        if (!currentUser || !currentUser.group) return 0;
        return users.filter(user => user.group === currentUser.group).length;
    };

    return (
        <div className="container my-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Connecté en tant que {currentUser ? currentUser.email : "Invité"}</h2>
                <button className="btn btn-danger" onClick={handleLogout}>Se déconnecter</button>
            </div>

            {/* 🔹 Intégration de Spotify */}
            <div className="card shadow-sm p-4 mb-4 bg-dark text-white">
                <h3 className="mb-3">Spotify</h3>

                {localStorage.getItem("spotify_token") ? (
                    <>
                        <h2>Bienvenue dans l'interface Spotify</h2>

                        {/* Vérifier si l'utilisateur est dans un groupe */}
                        {currentUser?.group && (
                            <CurrentTrack2
                                currentUser={currentUser}
                                users={users}
                                salons={salons}
                                showForAdmin={!salons.find(salon => salon.name === currentUser.group)?.roles?.[currentUser.email] === "admin"}
                            />
                        )}

                        <button
                            onClick={() => {
                                localStorage.removeItem("spotify_token");
                                window.location.reload();
                            }}
                            className="btn btn-warning mt-3"
                        >
                            Se déconnecter de Spotify
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => { window.location.href = AUTH_URL; }}
                        className="btn btn-success"
                    >
                        Se connecter avec Spotify
                    </button>
                )}
            </div>




            {/* 🔹 Gestion des groupes */}
            <div className="card shadow-sm p-4 mb-4">
                <div className="d-flex align-items-center">
                    <button className="btn btn-success me-3" onClick={handleJoinGroup}>+</button>
                    {groupName ? <h3>Groupe Rejoint : {groupName}</h3> : <h3>Aucun groupe rejoint</h3>}
                </div>
                {currentUser?.group && (
                    <p className="mt-2">Nombre d'utilisateurs dans ce groupe : {getUsersInSameGroup()}</p>
                )}
            </div>
            {currentUser?.group && (
                <div className="card shadow-sm p-4 mb-4">
                    <h3>Membres du groupe</h3>
                    <ul className="list-group">
                        {users.filter(user => user.group === currentUser?.group).map((user, index) => {
                            const userSalon = salons.find(salon => salon.name === user.group);
                            const role = userSalon?.roles?.[user.email] === "admin" ? "Admin" : "Membre";

                            // Vérification basée sur `spotifyId` ou `spotify_link`
                            const isSpotifyLinked = user.spotifyId || user.spotify_link;
                            const spotifyStatusText = isSpotifyLinked ? "Compte lié" : "Compte non lié";

                            return (
                                <li key={index} className="list-group-item d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-center">
                    <span>
                        {user.email} - <span className="fw-bold">{role}</span>
                    </span>
                                        <span className={isSpotifyLinked ? "text-success" : "text-danger"}>
                        {spotifyStatusText}
                    </span>
                                    </div>

                                    {/* 🔹 Afficher les composants Spotify si l'utilisateur a un compte lié */}
                                    {isSpotifyLinked && (
                                        <div className="mt-2 text-dark">
                                            <UserProfile />
                                            <CurrentTrack />
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                </div>
            )}

            {/* 🔹 Liste des salons */}
            <button onClick={() => setShowGroups(!showGroups)} className="btn btn-secondary mb-4">
                {showGroups ? "Cacher" : "Afficher"} la liste des salons
            </button>

            {showGroups && (
                <div className="card shadow-sm p-4">
                    <h3 className="mb-3">Liste des salons</h3>
                    <div className="row">
                        {salons.length > 0 ? (
                            salons.map((salon, index) => (
                                <div key={index} className="col-md-4">
                                    <div className="card mb-3 p-3">
                                        <h5>{salon.name}</h5>
                                        <ul className="list-unstyled">
                                            {salon.members.map((member, idx) => (
                                                <li key={idx} className="text-muted">{member}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>Aucun salon disponible</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
