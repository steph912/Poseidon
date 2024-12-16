// creer une partie + ensuite rediriger sur attente_du_joueur.html
"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");;

const trait = function (req, res, query) {

	let marqueurs;
	let page;
	let contenu_fichier;
	let listeMembres;
	let trouve;
	
	//GENERE UN NOMBRE DE 000 000 A 999 999 
	function codeAleatoire() {
		const caracteres = "0123456789";
		const tailleCode = 6;
		let code = "";
	
		for (let i = 0; i < tailleCode; i++) {
			const indexAleatoire = Math.floor(Math.random() * caracteres.length);
			code += caracteres[indexAleatoire];
		}
	
		return code;
	}
	
	console.log("Votre code généré est : " + codeAleatoire());

	// ON LIT LES PARTIES EXISTANTS

	contenu_fichier = fs.readFileSync("parties.json", 'utf-8');
	listeMembres = JSON.parse(contenu_fichier);

	if (trouve === true) {
    // SI CREATION PAS OK, ON REAFFICHE PAGE FORMULAIRE AVEC ERREUR

		page = fs.readFileSync('./html/jouer_contre_un_joueur.html', 'utf-8');
       
		marqueurs = {};
		marqueurs.erreur = "ERREUR, la partie existe deja : ";
		marqueurs.pseudo = query.pseudo;
		page = nunjucks.renderString(page, marqueurs);

	} else {
	// SI CREATION OK, ON RENVOIE SUR LA PAGE ATTENTE DU JOUEUR 
		page = fs.readFileSync('./html/attente_du_joueur.html', 'UTF-8');

		marqueurs = {};
		marqueurs.pseudo = query.pseudo;
		marqueurs.password = query.password;
		page = nunjucks.renderString(page, marqueurs);
	}
	
	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;

