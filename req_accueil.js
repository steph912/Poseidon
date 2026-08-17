"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");
const { interpreterCheckbox } = require("./combat_utils.js");

const trait = function (req, res, query) {

	let marqueurs;
	let page;

	// AFFICHAGE DE LA PAGE accueil.html

	page = fs.readFileSync('./html/accueil.html', 'utf-8');

	marqueurs = {};
	marqueurs.pseudo = query.pseudo;
	marqueurs.password = query.password;
	marqueurs.erreur = "";

	// Options choisies sur la page "Options" (valables uniquement pour la prochaine partie contre l'ordinateur).
	// Si elles ne sont pas présentes dans la requête (arrivée directe sur l'accueil), on applique les valeurs par défaut.
	marqueurs.timer = interpreterCheckbox(query.timer, false) ? "on" : "";
	marqueurs.missiles = interpreterCheckbox(query.missiles, true) ? "on" : "";
	marqueurs.ia_level = query.ia_level || "facile";

	page = nunjucks.renderString(page, marqueurs);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;
