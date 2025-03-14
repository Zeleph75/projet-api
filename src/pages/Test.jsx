import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Pour la redirectionimport { jwtDecode } from "jwt-decode";
import { jwtDecode } from "jwt-decode";
import "./ListeGroupe.css";

export default function TestPage() {
    const [groupName, setGroupName] = useState("");
    const [users, setUsers] = useState([]);
    const [showGroups, setShowGroups] = useState(true);
    const [salons, setSalons] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/"); // Redirige si pas de token
            return;
        }

        // ✅ Décode le token pour récupérer l'email
        try {
            const decoded = jwtDecode(token);
            if (!decoded.email) throw new Error("Email non valide dans le token");

            const userEmail = decoded.email;

            fetch("http://localhost:5000/data", {
                headers: { Authorization: `Bearer ${token}` },
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
                        handleLogout(); // Déconnexion si l'utilisateur n'existe pas
                        return;
                    }

                    setCurrentUser(loggedInUser);
                    setGroupName(loggedInUser.group || "");
                })
                .catch(error => {
                    console.error("Erreur lors de la récupération des données:", error);
                    handleLogout(); // Redirige en cas de problème
                });

        } catch (error) {
            console.error("Token invalide ou expiré :", error);
            handleLogout(); // Déconnexion automatique
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/"); // Redirige vers la page d'accueil
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

            <div className="card shadow-sm p-4 mb-4">
                <div className="d-flex align-items-center">
                    <button className="btn btn-success me-3" onClick={handleJoinGroup}>+</button>
                    {groupName && <h3>Groupe Rejoint : {groupName}</h3>}
                </div>
                {currentUser && currentUser.group && (
                    <p className="mt-2">Nombre d'utilisateurs dans ce groupe : {getUsersInSameGroup()}</p>
                )}
            </div>

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
