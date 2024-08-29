import express from "express";
import fs from "node:fs";
import cors from "cors";

const app = express();
const port = 4000;
const path = "../data/data.json";

app.use(cors());
app.use(express.json()); // Ajouter le middleware pour parser le JSON

// Fonction pour lire les données depuis le fichier JSON
const readData = () => {
  const data = fs.readFileSync(path, "utf8");
  return JSON.parse(data);
};

// Fonction pour écrire les données dans le fichier JSON
const writeData = (data) => {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
};

app.get("/possession", (req, res) => {
  fs.readFile(path, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Erreur de lecture des données" });
    }

    const result = JSON.parse(data);
    const patrimoine = result.find((item) => item.model === "Patrimoine");

    if (patrimoine) {
      res.json(patrimoine.data.possessions);
    } else {
      res.status(404).json({ message: "Patrimoine non trouvé" });
    }
  });
});

// Route pour créer une nouvelle possession
app.post("/possession", (req, res) => {
  const {
    possesseurNom,
    type, // Assurez-vous que le champ `type` est présent
    libelle,
    valeur,
    dateDebut,
    tauxAmortissement,
    jour,
    valeurConstante,
  } = req.body;

  if (!libelle || !valeur || !dateDebut) {
    return res.status(400).json({
      message: "Libellé, valeur, et date de début sont obligatoires.",
    });
  }

  const newPossession = {
    possesseur: { nom: possesseurNom },
    type: type || "Bien Materiel", // Définissez un type par défaut si non fourni
    libelle,
    valeur,
    dateDebut,
    tauxAmortissement: tauxAmortissement || null,
    jour: jour || null,
    valeurConstante: valeurConstante || null,
    dateFin: null,
  };

  const data = readData();
  const patrimoine = data.find(
    (item) =>
      item.model === "Patrimoine" && item.data.possesseur.nom === possesseurNom
  );

  if (patrimoine) {
    patrimoine.data.possessions.push(newPossession);
    writeData(data); // Écrire les données mises à jour dans le fichier
    res.status(201).json(newPossession);
  } else {
    res
      .status(404)
      .json({ message: `Patrimoine pour ${possesseurNom} non trouvé.` });
  }
});

app.put("/possession/:libelle", (req, res) => {
  const { libelle } = req.params;
  const updateFields = req.body;

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ message: "Aucun champ à mettre à jour." });
  }

  const data = readData();
  const patrimoine = data.find((item) => item.model === "Patrimoine");

  if (patrimoine) {
    const possession = patrimoine.data.possessions.find(
      (item) => item.libelle === libelle
    );

    if (possession) {
      // Mettre à jour les champs spécifiés
      Object.assign(possession, updateFields);
      writeData(data);
      res.status(200).json(possession);
    } else {
      res
        .status(404)
        .json({ message: `Possession avec libelle ${libelle} non trouvée.` });
    }
  } else {
    res.status(404).json({ message: "Patrimoine non trouvé." });
  }
});

app.put("/possession/:libelle/close", (req, res) => {
  const { libelle } = req.params;
  const data = readData();
  const patrimoine = data.find((item) => item.model === "Patrimoine");

  if (patrimoine) {
    const possession = patrimoine.data.possessions.find(
      (item) => item.libelle === libelle
    );

    if (possession) {
      // Mettre à jour `dateFin` à la date actuelle
      possession.dateFin = new Date().toISOString().split("T")[0];
      writeData(data); // Sauvegarder les données mises à jour
      res.status(200).json(possession);
    } else {
      res
        .status(404)
        .json({ message: `Possession avec libelle ${libelle} non trouvée.` });
    }
  } else {
    res.status(404).json({ message: "Patrimoine non trouvé." });
  }
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});