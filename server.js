import express from "express";
import fs from "fs/promises"; // Utilisation des Promises pour éviter les callbacks
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config(); // Charger les variables d'environnement

const app = express();
app.use(express.json());
app.use(cors());

const USERS_FILE = "./public/users.json";
const SECRET_KEY = process.env.SECRET_KEY || "supersecretkey"; // 🔐 Utilisation d'une clé sécurisée

// 🔹 Route pour inscrire un utilisateur (REGISTER)
app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    try {
        const data = await fs.readFile(USERS_FILE, "utf8");
        let usersData = JSON.parse(data);

        // Vérifie si l'utilisateur existe déjà
        if (usersData.users.some(user => user.email === email)) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        // Hache le mot de passe avant de l'enregistrer
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Ajoute le nouvel utilisateur
        usersData.users.push({ email, password: hashedPassword });

        // Sauvegarde dans users.json
        await fs.writeFile(USERS_FILE, JSON.stringify(usersData, null, 2));

        res.status(201).json({ message: "Inscription réussie !" });

    } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// 🔹 Route pour la connexion (LOGIN)
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const data = await fs.readFile(USERS_FILE, "utf8");
        let usersData = JSON.parse(data);

        // Vérifie si l'utilisateur existe
        const user = usersData.users.find(user => user.email === email);
        if (!user) {
            return res.status(400).json({ message: "Utilisateur non trouvé." });
        }

        // Vérifie le mot de passe avec bcrypt
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Mot de passe incorrect." });
        }

        // Génère un Token JWT valable 1 heure
        const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: "1h" });

        res.json({ message: "Connexion réussie !", token });

    } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// 🔹 Démarrer le serveur
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
