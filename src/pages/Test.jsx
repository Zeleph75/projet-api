import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../store/authStore";
import UserProfile from "../components/UserProfile";
import CurrentTrack from "../components/CurrentTrack";
import { AUTH_URL } from "../utils/auth.js";
import "./ListeGroupe.css";

export default function TestPage() {
    const [groupName, setGroupName] = useState("");
    const [users, setUsers] = useState([]);
    const [showGroups, setShowGroups] = useState(true);
    const [salons, setSalons] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [spotifyToken, setSpotifyToken] = useState(null);
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        const localToken = localStorage.getItem("token");
        const localSpotifyToken = localStorage.getItem("spotify_token");

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
                        if (userWithSpotifyToken) {
                            const tokenToUse = localSpotifyToken || userWithSpotifyToken.accessToken;
                            setSpotifyToken(tokenToUse);
                            localStorage.setItem("spotify_token", tokenToUse);
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
                {spotifyToken ? (
                    <>
                        <h2>Bienvenue dans l'interface Spotify</h2>
                        <UserProfile />
                        <CurrentTrack />
                    </>
                ) : (
                    <button onClick={handleSpotifyLogin} className="btn btn-success">
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
                            return (
                                <li key={index} className="list-group-item d-flex justify-content-between">
                                    {user.email} - <span className="fw-bold">{role}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
