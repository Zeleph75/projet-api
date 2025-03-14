import express from "express";
import fs from "fs/promises"; // Utilisation des Promises pour éviter les callbacks
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const USERS_FILE = "./public/users.json";
const SECRET_KEY = process.env.SECRET_KEY || "supersecretkey";

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1]; // Récupérer le token
    if (!token) return res.status(401).json({ message: "Accès non autorisé" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Token invalide" });
        req.user = user;
        next();
    });
};

// Route pour s'inscrire
app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    try {
        const data = await fs.readFile(USERS_FILE, "utf8");
        let usersData = JSON.parse(data);

        if (usersData.users.some(user => user.email === email)) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        usersData.users.push({ email, password: hashedPassword });

        await fs.writeFile(USERS_FILE, JSON.stringify(usersData, null, 2));

        res.status(201).json({ message: "Inscription réussie !" });
    } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Route pour se connecter
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const data = await fs.readFile(USERS_FILE, "utf8");
        let usersData = JSON.parse(data);

        const user = usersData.users.find(user => user.email === email);
        if (!user) {
            return res.status(400).json({ message: "Utilisateur non trouvé." });
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Mot de passe incorrect." });
        }

        const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: "1h" });

        res.json({ message: "Connexion réussie !", token, email: user.email });

    } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Route protégée pour récupérer les utilisateurs et salons
app.get("/data", authenticateToken, async (req, res) => {
    try {
        const data = await fs.readFile(USERS_FILE, "utf8");
        res.json(JSON.parse(data));
    } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// 🔹 Route pour mettre à jour les groupes (utilisateurs)
app.post("/update-group", async (req, res) => {
    const { users } = req.body;

    if (!users || !Array.isArray(users)) {
        return res.status(400).json({ message: "Données invalides" });
    }

    try {
        const data = await fs.readFile(USERS_FILE, "utf8");
        let jsonData = JSON.parse(data);

        jsonData.users = users; // Mise à jour des utilisateurs

        await fs.writeFile(USERS_FILE, JSON.stringify(jsonData, null, 2));
        res.status(200).json({ message: "Utilisateurs mis à jour avec succès" });

    } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// 🔹 Route pour mettre à jour les salons
app.post("/update-salons", async (req, res) => {
    const { salons } = req.body;

    if (!salons || !Array.isArray(salons)) {
        return res.status(400).json({ message: "Données invalides" });
    }

    try {
        const data = await fs.readFile(USERS_FILE, "utf8");
        let jsonData = JSON.parse(data);

        // Suppression des salons vides
        jsonData.salons = salons.filter(salon => salon.members && salon.members.length > 0);

        await fs.writeFile(USERS_FILE, JSON.stringify(jsonData, null, 2));
        res.status(200).json({ message: "Salons mis à jour avec succès" });

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
