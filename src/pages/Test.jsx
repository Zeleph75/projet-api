import { useState } from "react";
import "./ListeGroupe.css";

export default function TestPage() {
    const [groupName, setGroupName] = useState("");
    const [users, setUsers] = useState([
        { email: "user1@example.com", password: "password123", group: "" },
        { email: "user2@example.com", password: "securepass", group: "" }
    ]);
    const [showGroups, setShowGroups] = useState(true);

    const handleJoinGroup = () => {
        const name = prompt("Entrez le nom du groupe :");
        if (name) {
            setGroupName(name);
            setUsers(users.map(user => ({ ...user, group: name })));
        }
    };

    return (
        <div>
            <div className="container_page_groupe">
                <h2>Connecté en tant que ...</h2>
                <button className="btn btn-primary">Se déconnecter</button>
            </div>
            <div className="container_info_groupe">
                <div className="container_bouton_rejoindre_groupe">
                    <button className="bouton_rejoindre_groupe" onClick={handleJoinGroup}>+</button>
                    {groupName && <h3>Groupe Rejoint : {groupName}</h3>}
                </div>
                <textarea disabled className="partage_lien_spotify" />

                <div className="liste_utilisateur">
                    {users.map((user, index) => (
                        <h2 key={index} className="utilisateur">{user.email} - Groupe : {user.group}</h2>
                    ))}
                </div>
            </div>

            <button onClick={() => setShowGroups(!showGroups)} className="toggle_groups_button">
                {showGroups ? "Cacher" : "Afficher"} la liste des salons
            </button>

            {showGroups && (
                <div className="container_liste_groupe">
                    <h1 className="titre_liste_salon">Liste des salons: </h1>
                    <div className="container_info_groupe_utilisateur">
                        <h2>Nom salon: ...</h2>
                        <div className="liste_groupe_utilisateurs">
                            <ul>
                                <li className="liste_groupe_utilisateur">Utilisateur1</li>
                                <li className="liste_groupe_utilisateur">Utilisateur2</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}