import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Vérifier que le serveur démarre bien
console.log("Le serveur est en train de démarrer...");

app.use(cors()); // Permettre les requêtes cross-origin
app.use(express.json()); // Pour analyser les requêtes en JSON

const filePath = path.join(process.cwd(), "public", "users.json");

// Route pour mettre à jour les groupes d'utilisateurs
app.post("/update-group", (req, res) => {
    console.log("Requête reçue pour /update-group");

    const { users } = req.body;
    if (!users) {
        return res.status(400).json({ message: "Données invalides" });
    }

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error("Erreur lors de la lecture du fichier:", err);
            return res.status(500).json({ message: "Erreur de lecture du fichier", error: err });
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (parseError) {
            console.error("Erreur lors du parsing JSON:", parseError);
            return res.status(500).json({ message: "Erreur de parsing JSON", error: parseError });
        }

        jsonData.users = users; // Met à jour les utilisateurs

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                console.error("Erreur d'écriture du fichier:", err);
                return res.status(500).json({ message: "Erreur de sauvegarde", error: err });
            }
            res.status(200).json({ message: "Utilisateurs mis à jour avec succès" });
        });
    });
});

// Route pour mettre à jour la liste des salons
app.post("/update-salons", (req, res) => {
    console.log("Requête reçue pour /update-salons");

    const { salons } = req.body;
    if (!salons) {
        return res.status(400).json({ message: "Données invalides" });
    }

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error("Erreur lors de la lecture du fichier:", err);
            return res.status(500).json({ message: "Erreur de lecture du fichier", error: err });
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (parseError) {
            console.error("Erreur lors du parsing JSON:", parseError);
            return res.status(500).json({ message: "Erreur de parsing JSON", error: parseError });
        }

        // Suppression des salons vides
        const cleanedSalons = salons.filter(salon => salon.members.length > 0);

        jsonData.salons = cleanedSalons; // Met à jour les salons après suppression des vides

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                console.error("Erreur d'écriture du fichier:", err);
                return res.status(500).json({ message: "Erreur de sauvegarde", error: err });
            }
            res.status(200).json({ message: "Salons mis à jour avec succès" });
        });
    });
});

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`✅ Serveur backend démarré sur http://localhost:${PORT}`);
});
