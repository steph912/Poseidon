"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");

const trait = function (req, res, query) {

	let marqueurs;
	let page;

	// AFFICHAGE DE LA PAGE jouer_contre_un_joueur.html

	page = fs.readFileSync('./html/jouer_contre_un_joueur.html', 'utf-8');

	marqueurs = {};
	marqueurs.pseudo = query.pseudo;
	marqueurs.password = query.password;
	marqueurs.erreur = "";
	page = nunjucks.renderString(page, marqueurs);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;
