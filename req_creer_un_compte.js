"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");

const trait = function (req, res, query) {

	let marqueurs;
	let page;

	// AFFICHAGE DE LA PAGE inscription.html

	page = fs.readFileSync('./html/inscription.html', 'utf-8');

	marqueurs = {};
	marqueurs.erreur = "";
	marqueurs.pseudo = "";
	page = nunjucks.renderString(page, marqueurs);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;
