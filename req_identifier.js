// Traitement de "req_identifier"

"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");;

const trait = function (req, res, query) {

	let marqueurs;
	let page;
	let contenu_fichier;
	let listeMembres;
	let i;
	let trouve;

	// ON LIT LES COMPTES EXISTANTS

	contenu_fichier = fs.readFileSync("membres.json", 'utf-8');
	listeMembres = JSON.parse(contenu_fichier);

	// ON VERIFIE QUE LE PSEUDO/PASSWORD EXISTE

	trouve = false;
	i = 0;
	while (i < listeMembres.length && trouve === false) {
		if (listeMembres[i].pseudo === query.pseudo) {
			if (listeMembres[i].password === query.password) {
				trouve = true;
			}
		}
		i++;
	}

	// ON RENVOIT UNE PAGE HTML 

	if (trouve === false) {
		// SI IDENTIFICATION INCORRECTE, ON REAFFICHE PAGE ACCUEIL AVEC ERREUR

		page = fs.readFileSync('connexion.html', 'utf-8');

		marqueurs = {};
		marqueurs.erreur = "ERREUR : compte ou mot de passe incorrect";
		marqueurs.pseudo = query.pseudo;
		page = nunjucks.renderString(page, marqueurs);

	} else {
		// SI IDENTIFICATION OK, ON ENVOIE PAGE ACCUEIL MEMBRE

		page = fs.readFileSync('acceuil.html', 'UTF-8');

		marqueurs = {};
		marqueurs.pseudo = query.pseudo;
		page = nunjucks.renderString(page, marqueurs);
	}

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;
