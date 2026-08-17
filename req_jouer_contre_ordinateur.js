"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");
const { chargerEtat, sauvegarderEtat } = require("./combat_utils.js");

const trait = function (req, res, query) {

	let marqueurs = {};
	let page;

	let code_partie = Math.floor(Math.random() * 100000000); // Génère un code de partie aléatoire à 8 chiffres donc 8 zeros
	marqueurs.code_partie = code_partie;

	let score = 1000; // On initialise le score à 1000
	marqueurs.score = score;

	let parties = JSON.parse(fs.readFileSync("./parties.json", "UTF-8")); // On récupère le tableau parties du fichier json

	parties.push(
		{
			code: code_partie,
			joueur: query.pseudo,
			score: score,
			date: new Date().toLocaleDateString("fr-FR"),
		}
	);

	fs.writeFileSync("./parties.json", JSON.stringify(parties), "UTF-8"); // On écrit le tableau parties dans le fichier json

	let grille = [];
	grille.length = 100;

	//ON INITIALISE LE TABLEAU EN NE METTANT QUE DU BLEU
	for (let i = 0; i < grille.length; i++) {
		grille[i] = "eau_inconnu"; // on initialise la grille avec des cases d'eau inconnue
	}
	//SI LE BATEAU PRENDS LES EMPLACEMENT DE LA GRILLE ON LEUR DONNE L'ETAT OCCUPE

	// ON SAUVEGARDE LES FICHIERS EXISTANTS POUR PEUT ETRE LES UTILISER APRES
	fs.writeFileSync(`./grilles/${marqueurs.code_partie}.json`, JSON.stringify(grille), "utf-8"); //on utilise stringify pour reconvertir notre objet javascript en chaine JSON

	// ----------------- OPTIONS CHOISIES SUR LA PAGE OPTIONS (valables pour cette partie uniquement) -----------------

	let options = {
		timer: query.timer === "on",
		missiles: query.missiles === "on",
		niveau_ia: (query.ia_level === "normal" || query.ia_level === "difficile") ? query.ia_level : "facile",
	};

	let etat = chargerEtat(code_partie, options);
	sauvegarderEtat(code_partie, etat);

	// AFFICHAGE DE LA PAGE placez_vos_bateaux.html
	page = fs.readFileSync('./html/placez_vos_bateaux.html', 'utf-8');

	marqueurs.pseudo = query.pseudo;
	marqueurs.password = query.password;
	marqueurs.erreur = "";

	page = nunjucks.renderString(page, marqueurs);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;
