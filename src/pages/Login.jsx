import { useState, useEffect } from "react";
import {data, useNavigate} from "react-router-dom";
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const validUser = users.find(
            (user) => user.email === email && user.password === password
        );
        if (validUser) {
            navigate("/test");
        } else {
            alert("Identifiants incorrects", data.users);
        }
    };

    return (
        <div className="container">
            <div className="login-box">
                <h2>Connexion</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Entrez votre email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Mot de passe</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Entrez votre mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="submit-btn">Se connecter</button>
                </form>
            </div>
        </div>
    );
}
