import { useState, useEffect } from "react";
import {data, useNavigate} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import "./Login.css";


export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

     useEffect(() => {
        fetch("/users.json")
            .then((response) => response.json())
            .then((data) => setUsers(data.users));
     }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token); // Stocker le token
                alert("Connexion réussie !");
                navigate("/test");
            } else {
                alert(data.message); // Afficher un message d'erreur du serveur
            }
        } catch (error) {
            console.error("Erreur lors de la connexion :", error);
            alert("Une erreur est survenue.");
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card shadow-lg p-4" style={{ maxWidth: "400px", width: "100%" }}>
                <h2 className="text-center mb-4">Connexion</h2>
                <form onSubmit={handleSubmit}>
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
                    <button type="submit" className="btn btn-primary w-100">Se connecter</button>
                    <p className="text-center mt-3">
                        Pas encore de compte ?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/signup")}
                            className="btn btn-link"
                        >
                            S'inscrire
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}
