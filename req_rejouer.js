"use strict";

const fs = require("fs");
const express = require("express");
const app = express();
const nunjucks = require("nunjucks");

app.use(express.json());

// Traite la réponse du joueur 
app.post("/rejouer", (req, res) => {
  const reponse = req.body.reponse; 
  fs.readFile("membres.json", 'utf-8', (err, contenu_fichier) => {
    if (err) {
      console.error("Erreur de lecture du fichier:", err);
      return res.status(500).send("Erreur serveur");
    }

    const listeMembres = JSON.parse(contenu_fichier);

    if (reponse === "OUI") {
      res.redirect("/placez_vos_bateaux.html");
    } else {
      res.redirect("/req_accueil");
    }
  });
});

app.get("/placez_vos_bateaux.html", (req, res) => {
  res.send("Placez vos bateaux");
});

app.listen(5000, () => {
  console.log("Serveur en cours d'exécution sur le port 5000");
});
