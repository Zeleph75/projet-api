import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SignPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch("http://localhost:5000/users")
            .then((response) => response.json())
            .then((data) => setUsers(data.users))
            .catch((error) => console.error("Erreur de récupération des utilisateurs :", error));
            ;
    }, []);

    const handleRegister = (e) => {
        e.preventDefault();

        // Vérifier si les mots de passe correspondent
        if (password !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }

        // Vérifier si l'email existe déjà
        const existingUser = users.find((user) => user.email === email);
        if (existingUser) {
            alert("Cet email est déjà utilisé.");
            return;
        }
        

        // Envoye l'utilisateur au serveur
        fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        })
        .then((response) => response.json())
        .then((data) => {
            alert(data.message);
            if (data.message === "Inscription réussie !") {
                navigate("/login"); 
            }
        })
        .catch((error) => {
            console.error("Erreur lors de l'inscription :", error);
            alert("Une erreur est survenue.");
        });
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card shadow-lg p-4" style={{ maxWidth: "400px", width: "100%" }}>
                <h2 className="text-center mb-4">Inscription</h2>
                <form onSubmit={handleRegister}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-control"
                            placeholder="Entrez votre email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Mot de passe</label>
                        <input
                            id="password"
                            type="password"
                            className="form-control"
                            placeholder="Entrez votre mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">Confirmer le mot de passe</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className="form-control"
                            placeholder="Confirmez votre mot de passe"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">S'inscrire</button>
                    <p className="text-center mt-3">
                        Déjà un compte ?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="btn btn-link"
                        >
                            Se connecter
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}
