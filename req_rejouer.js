"use strict";

const fs = require("fs"); // Module pour lire et écrire des fichiers 
const express = require("express");
const app = express();
const nunjucks = require("nunjucks");


// Traite la réponse du joueur ²
app.post("/rejouer", (req, res) => { 
  const reponse = req.body.reponse; // Récupération de la réponse du joueur
  fs.readFile("membres.json", 'utf-8', (err, contenu_fichier) => { // Lecture du fichier membres.json
    if (err) {
      console.error("Erreur de lecture du fichier:", err); // Affichage d'un message d'erreur
      return res.status(5000).send("Erreur serveur"); // Envoi d'un message d'erreur
    }

    const listeMembres = JSON.parse(contenu_fichier); // Conversion du contenu du fichier en objet JavaScript

    if (reponse === "OUI") {
      res.redirect("/placez_vos_bateaux.html"); // Redirection vers la page "placez_vos_bateaux.html"
    } else {
      res.redirect("/req_accueil"); // Redirection vers la page d'accueil
    }
  });
});
