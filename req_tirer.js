// Requête Tirer
// - 

"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");



const trait = function (req, res, query) {
	let marqueurs;
	let page;
    
    

	// Actualisation de la page

	page = fs.readFileSync('./html/phase_de_combat.html', 'utf-8');

	marqueurs = {};
	marqueurs.pseudo = query.pseudo;
	marqueurs.password = query.password;
	marqueurs.code_partie = query.code_partie;
	marqueurs.erreur = "";

	page = nunjucks.renderString(page, marqueurs);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;
