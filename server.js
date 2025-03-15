import express from "express";
import fs from "fs/promises";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import session from "express-session";
import passport from "passport";
import { Strategy as SpotifyStrategy } from "passport-spotify";
import { swaggerDocs, swaggerUI } from "./swagger.js";



const app = express();
app.use(express.json());
app.use(cors());
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Configuration de la session
app.use(session({ secret: "spotify_secret", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

const USERS_FILE = "./public/users.json";
const SECRET_KEY = "supersecretkey"; // ⚠️ À changer en prod

// Middleware d'authentification JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Accès non autorisé" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Token invalide" });
        req.user = user;
        next();
    });
};

// 📌 Configuration Passport.js avec Spotify
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
    new SpotifyStrategy(
        {
            clientID: "ab068ab78494424ab096c6ecd4e4a9f0",
            clientSecret: "4de9e26299cc4ad4863bb72591426a9b",
            callbackURL: "http://localhost:5000/callback"
        },
        async (accessToken, refreshToken, expires_in, profile, done) => {
            try {
                // Lire le fichier users.json
                const data = await fs.readFile(USERS_FILE, "utf8");
                let usersData = JSON.parse(data);

                // Chercher l'utilisateur dans le fichier JSON
                let user = usersData.users.find(user => user.email === profile.emails[0].value);

                if (!user) {
                    // Si l'utilisateur n'existe pas, on le crée
                    user = {
                        email: profile.emails[0].value,
                        password: "",
                        group: "",
                        spotifyId: profile.id,
                        display_name: profile.display_name,
                        spotify_link: `https://open.spotify.com/user/${profile.id}`
                    };
                    usersData.users.push(user);
                } else {
                    // Mettre à jour l'utilisateur (SANS stocker accessToken)
                    user.spotifyId = profile.id;
                    user.display_name = profile.display_name;
                    user.spotify_link = `https://open.spotify.com/user/${profile.id}`;
                }

                // Sauvegarder sans le token
                await fs.writeFile(USERS_FILE, JSON.stringify(usersData, null, 2));

                // Retourner l'utilisateur avec accessToken uniquement pour cette session
                return done(null, { profile, accessToken });
            } catch (err) {
                return done(err);
            }
        }
    )
);
/**
 * @swagger
 * /callback:
 *   get:
 *     summary: Callback après l'authentification Spotify
 *     description: Récupère le token Spotify et redirige l'utilisateur vers le frontend.
 *     responses:
 *       302:
 *         description: Redirige vers le front-end avec le token Spotify.
 */

// Callback de Spotify après l'authentification
app.get("/callback", passport.authenticate("spotify", { failureRedirect: "/" }), (req, res) => {
    if (!req.user) {
        return res.redirect("http://localhost:5173/test?error=auth_failed");
    }

    // 🔹 Récupérer le token Spotify
    const accessToken = req.user.accessToken;

    // 🔹 Rediriger vers le front-end avec le token en paramètre d'URL
    res.redirect(`http://localhost:5173/test?spotify_token=${accessToken}`);
});



/**
 * @swagger
 * /auth/spotify:
 *   get:
 *     summary: Connexion avec Spotify
 *     description: Redirige l'utilisateur vers l'authentification Spotify.
 *     responses:
 *       302:
 *         description: Redirige vers Spotify pour l'authentification.
 */

// 📌 Routes d'authentification Spotify
app.get("/auth/spotify", passport.authenticate("spotify", { scope: ["user-read-email", "user-read-private"] }));





app.get("/success", (req, res) => {
    res.json({ message: "Authentification réussie", user: req.user });
});

app.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
});
// 📌 Nouvelle route pour obtenir la musique en cours
/**
 * @swagger
 * /current-track:
 *   get:
 *     summary: Récupérer la musique en cours de lecture sur Spotify
 *     description: Retourne les détails de la musique en cours d'écoute de l'utilisateur connecté à Spotify.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Succès - Retourne les informations du titre en cours de lecture.
 *         content:
 *           application/json:
 *             example:
 *               name: "Shape of You"
 *               artists: "Ed Sheeran"
 *               album: "Divide"
 *               image: "https://example.com/image.jpg"
 *       204:
 *         description: Aucune musique en cours de lecture.
 *       400:
 *         description: Erreur lors de la récupération de la musique.
 *       401:
 *         description: Accès non autorisé (token manquant ou invalide).
 *       500:
 *         description: Erreur serveur.
 */

app.get("/current-track", authenticateToken, async (req, res) => {
    const { accessToken } = req.user; // Utiliser le token d'accès Spotify

    try {
        const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.status === 204) {
            return res.status(200).json({ message: "Aucune musique en cours." });
        }

        const data = await response.json();

        if (data && data.item) {
            const track = {
                name: data.item.name,
                artists: data.item.artists.map((artist) => artist.name).join(", "),
                album: data.item.album.name,
                image: data.item.album.images[0]?.url,
            };
            return res.json(track);
        } else {
            return res.status(400).json({ message: "Erreur lors de la récupération de la musique." });
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de la musique en cours:", error);
        return res.status(500).json({ message: "Erreur serveur." });
    }
});

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
