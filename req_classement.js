"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");
const { obtenirClassement } = require("./combat_utils.js");

const trait = function (req, res, query) {

	let marqueurs = {};
	let page;

	// AFFICHAGE DE LA PAGE classement.html

	page = fs.readFileSync('./html/classement.html', 'utf-8');

	marqueurs.pseudo = query.pseudo;
	marqueurs.password = query.password;
	marqueurs.score = query.score;
	marqueurs.erreur = "";

	// Classement des 10 meilleurs scores, tous joueurs confondus (persisté dans parties.json, donc partagé entre tous)
	marqueurs.classement = obtenirClassement(10);

	page = nunjucks.renderString(page, marqueurs);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;
