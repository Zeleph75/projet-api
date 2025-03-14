import express from "express";
import fs from "fs/promises";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import setupSwagger from "./swagger.js"; // Import Swagger

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

setupSwagger(app); // Ajout de Swagger UI

const USERS_FILE = "./public/users.json";
const SECRET_KEY = process.env.SECRET_KEY || "supersecretkey";

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Accès non autorisé" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Token invalide" });
        req.user = user;
        next();
    });
};

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inscription réussie
 *       400:
 *         description: Email déjà utilisé
 */
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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie, retourne un token
 *       400:
 *         description: Utilisateur non trouvé ou mot de passe incorrect
 */
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

/**
 * @swagger
 * /data:
 *   get:
 *     summary: Récupérer les utilisateurs et salons (nécessite un token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données récupérées avec succès
 *       401:
 *         description: Accès non autorisé
 */
// Route protégée pour récupérer les utilisateurs et salons
/**
 * @swagger
 * /data:
 *   get:
 *     summary: Récupérer les utilisateurs et salons (nécessite un token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données récupérées avec succès
 *         content:
 *           application/json:
 *             example:
 *               users:
 *                 - email: "test@example.com"
 *                   group: "Admin"
 *               salons:
 *                 - name: "Salon 1"
 *                   members: ["test@example.com"]
 *       401:
 *         description: Accès non autorisé (token manquant ou invalide)
 *       500:
 *         description: Erreur serveur
 */
app.get("/data", authenticateToken, async (req, res) => {
    try {
        const data = await fs.readFile(USERS_FILE, "utf8");
        res.json(JSON.parse(data));
    } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

/**
 * @swagger
 * /update-group:
 *   post:
 *     summary: Mettre à jour les groupes d'utilisateurs
 *     description: Met à jour la liste des utilisateurs et supprime ceux qui n'ont pas de groupe.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     group:
 *                       type: string
 *     responses:
 *       200:
 *         description: Utilisateurs mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
app.post("/update-group", authenticateToken, async (req, res) => {
    const { users } = req.body;

    if (!users || !Array.isArray(users)) {
        return res.status(400).json({ message: "Données invalides" });
    }

    try {
        const data = await fs.readFile(USERS_FILE, "utf8");
        let jsonData = JSON.parse(data);

        // Suppression des utilisateurs sans groupe
        jsonData.users = users.filter(user => user.group);

        await fs.writeFile(USERS_FILE, JSON.stringify(jsonData, null, 2));
        res.status(200).json({ message: "Utilisateurs mis à jour avec succès" });

    } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

/**
 * @swagger
 * /update-salons:
 *   post:
 *     summary: Mettre à jour les salons
 *     description: Met à jour la liste des salons, supprime les salons vides et assigne un nouvel admin si nécessaire.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               salons:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     members:
 *                       type: array
 *                       items:
 *                         type: string
 *                     roles:
 *                       type: object
 *                       additionalProperties:
 *                         type: string
 *     responses:
 *       200:
 *         description: Salons mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
app.post("/update-salons", authenticateToken, async (req, res) => {
    const { salons } = req.body;

    if (!salons || !Array.isArray(salons)) {
        return res.status(400).json({ message: "Données invalides" });
    }

    try {
        const data = await fs.readFile(USERS_FILE, "utf8");
        let jsonData = JSON.parse(data);

        jsonData.salons = salons
            .filter(salon => salon.members && salon.members.length > 0) // Supprime les salons vides
            .map(salon => {
                let currentAdmins = Object.entries(salon.roles)
                    .filter(([email, role]) => role === "admin" && salon.members.includes(email))
                    .map(([email]) => email);

                // Supprimer les admins qui ont quitté
                for (let admin of currentAdmins) {
                    if (!salon.members.includes(admin)) {
                        delete salon.roles[admin];
                    }
                }

                // Récupérer les admins restants après la suppression
                let remainingAdmins = Object.entries(salon.roles)
                    .filter(([email, role]) => role === "admin" && salon.members.includes(email))
                    .map(([email]) => email);

                // Si plus aucun admin, attribuer un nouvel admin aléatoire
                if (remainingAdmins.length === 0 && salon.members.length > 0) {
                    const newAdmin = salon.members[Math.floor(Math.random() * salon.members.length)];
                    salon.roles[newAdmin] = "admin";
                    console.log(`Nouvel admin assigné à ${salon.name} : ${newAdmin}`);
                }

                return salon;
            });

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
