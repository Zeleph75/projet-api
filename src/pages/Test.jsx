import { useState, useEffect } from "react";
import "./ListeGroupe.css";

export default function TestPage() {
    const [groupName, setGroupName] = useState("");
    const [users, setUsers] = useState([]);
    const [showGroups, setShowGroups] = useState(true);
    const [salons, setSalons] = useState([]);
    const [currentUser, setCurrentUser] = useState(null); // Utilisateur connecté

    useEffect(() => {
        fetch("/users.json")
            .then(response => response.json())
            .then(data => {
                setUsers(data.users || []);
                setSalons(data.salons || []);

                // Définit user1@example.com comme utilisateur par défaut
                const defaultUser = data.users.find(user => user.email === "user2@example.com") || null;
                setCurrentUser(defaultUser);
                if (defaultUser) setGroupName(defaultUser.group || "");
            })
            .catch(error => console.error("Erreur lors de la récupération des données:", error));
    }, []);

    const handleJoinGroup = async () => {
        if (!currentUser) return alert("Aucun utilisateur connecté");

        const name = prompt("Entrez le nom du groupe :");
        if (!name) return;

        // Mise à jour locale des utilisateurs
        const updatedUsers = users.map(user =>
            user.email === currentUser.email ? { ...user, group: name } : user
        );
        setUsers(updatedUsers);
        setGroupName(name);

        // Mise à jour locale des salons
        const updatedSalons = salons.map(salon => {
            // Retirer l'utilisateur de l'ancien salon
            if (salon.members.includes(currentUser.email)) {
                salon.members = salon.members.filter(member => member !== currentUser.email);
            }
            return salon;
        });

        // Ajouter l'utilisateur au nouveau salon
        const salonIndex = updatedSalons.findIndex(salon => salon.name === name);
        if (salonIndex !== -1) {
            // Si le salon existe, on ajoute l'utilisateur s'il n'y est pas déjà
            if (!updatedSalons[salonIndex].members.includes(currentUser.email)) {
                updatedSalons[salonIndex].members.push(currentUser.email);
            }
        } else {
            // Si le salon n'existe pas, on en crée un nouveau
            updatedSalons.push({
                name,
                members: [currentUser.email],
                roles: { [currentUser.email]: "admin" } // Attribuer le rôle d'administrateur à l'utilisateur
            });
        }

        // Supprimer les salons vides (si leur tableau de membres est vide)
        const cleanedSalons = updatedSalons.filter(salon => salon.members.length > 0);

        setSalons(cleanedSalons);

        // Envoi des données mises à jour au serveur (si backend disponible)
        try {
            await fetch("http://localhost:5000/update-group", { // URL du backend
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ users: updatedUsers })
            });

            await fetch("http://localhost:5000/update-salons", { // URL du backend
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ salons: cleanedSalons }) // Envoie des salons nettoyés
            });

            console.log("Mise à jour réussie !");
        } catch (error) {
            console.error("Erreur lors de la mise à jour :", error);
        }
    };

    // Compter le nombre d'utilisateurs dans le même groupe que currentUser
    const getUsersInSameGroup = () => {
        if (!currentUser || !currentUser.group) return 0;
        return users.filter(user => user.group === currentUser.group).length;
    };

    return (
        <div>
            <div className="container_page_groupe">
                <h2>Connecté en tant que {currentUser ? currentUser.email : "Invité"}</h2>
                <button className="btn btn-primary">Se déconnecter</button>
            </div>

            <div className="container_info_groupe">
                <div className="container_bouton_rejoindre_groupe">
                    <button className="bouton_rejoindre_groupe" onClick={handleJoinGroup}>+</button>
                    {groupName && <h3>Groupe Rejoint : {groupName}</h3>}
                    {currentUser && currentUser.group && (
                        <p>Nombre d'utilisateurs dans ce groupe : {getUsersInSameGroup()}</p>
                    )}
                </div>
                <textarea disabled className="partage_lien_spotify" />

                <div className="liste_utilisateur">
                    {users
                        .filter(user => user.group === currentUser?.group) // Filtre les utilisateurs qui sont dans le même groupe que currentUser
                        .map((user, index) => {
                            // Trouver le salon auquel appartient l'utilisateur
                            const userSalon = salons.find(salon => salon.name === user.group);

                            // Vérifier si un salon a été trouvé et si l'utilisateur est un administrateur
                            const role = userSalon?.roles?.[user.email] === "admin" ? "admin" : "user";

                            return (
                                <h2 key={index} className="utilisateur">
                                    {user.email} - Groupe : {user.group || "Aucun"} - Rôle : {role}
                                </h2>
                            );
                        })}
                </div>



            </div>

            <button onClick={() => setShowGroups(!showGroups)} className="toggle_groups_button">
                {showGroups ? "Cacher" : "Afficher"} la liste des salons
            </button>

            {showGroups && (
                <div className="container_liste_groupe">
                    <h1 className="titre_liste_salon">Liste des salons: </h1>
                    <div className="container_info_groupe_utilisateur">
                        {salons.length > 0 ? (
                            salons.map((salon, index) => (
                                <div key={index} className="salon">
                                    <h2>{salon.name}</h2>
                                    <ul>
                                        {salon.members.map((member, idx) => (
                                            <li key={idx} className="liste_groupe_utilisateur">{member}</li>
                                        ))}
                                    </ul>
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
