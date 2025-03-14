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
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
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
        navigate("/");
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
                {token ? (
                    <>
                        <UserProfile />
                        <CurrentTrack />
                    </>
                ) : (
                    <button
                        onClick={() => (window.location.href = AUTH_URL)}
                        className="btn btn-success"
                    >
                        Se connecter avec Spotify
                    </button>
                )}
            </div>

            {/* 🔹 Gestion des groupes */}
            <div className="card shadow-sm p-4 mb-4">
                <h3>Groupe Rejoint : {groupName || "Aucun groupe"}</h3>
                <p>Nombre d'utilisateurs : {users.filter(user => user.group === groupName).length}</p>
            </div>

            {/* 🔹 Liste des salons */}
            <button onClick={() => setShowGroups(!showGroups)} className="btn btn-secondary mb-4">
                {showGroups ? "Cacher" : "Afficher"} la liste des salons
            </button>

            {showGroups && (
                <div className="card shadow-sm p-4">
                    <h3>Liste des salons</h3>
                    {salons.length > 0 ? (
                        salons.map((salon, index) => (
                            <div key={index} className="card mb-3 p-3">
                                <h5>{salon.name}</h5>
                                <ul>
                                    {salon.members.map((member, idx) => (
                                        <li key={idx} className="text-muted">{member}</li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p>Aucun salon disponible</p>
                    )}
                </div>
            )}
        </div>
    );
}
