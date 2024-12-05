// Traitement de "req_afficher_formulaire_inscription"

"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");;

const trait = function (req, res, query) {

	let marqueurs;
	let page;

	// AFFICHAGE DE LA modele_formulaire_inscription

	page = fs.readFileSync('inscription.html', 'utf-8');

	marqueurs = {};
	marqueurs.erreur = "";
	marqueurs.pseudo = "";
	marqueurs.erreur = "";
	page = nunjucks.renderString(page, marqueurs);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;
