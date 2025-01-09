"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");;

const trait = function (req, res, query) {

	let marqueurs;
	let page;
	let grille = []
	let i = 0;
	let résultat;
	grille.length = 99;
	let état = ["eau-inconnu", "bateaux-inconnu"];


	//ON LIT LES FICHIERS EXISTANTS
	const contenu_fichier = fs.readFileSync("case_bateaux.json", "utf-8") //on lit le fichier json qui sera une chaine de caractère
	grille = JSON.parse(contenu_fichier); // on convertit la chaine de caractère en objet java script (tableau quon appelle grille)

	//ON INITIALISE LE TABLEAU EN NE METTANT QUE DU BLEU

		while (i < grille.length) {
			résultat = état[0]; // Sélectionne un état aléatoire ("eau-inconnu" ou "bateaux-inconnu")
			grille[i] = résultat; // Stocke le résultat dans la grilleS		
			i++
		}
	//SI LE BATEAU PRENDS LES EMPLACEMENT DE LA GRILLE ON LEUR DONNE L'ETAT OCCUPE 
	
	// ON SAUVEGARDE LES FICHIERS EXISTANTS POUR PEUT ETRE LES UTILISER APRES 
	fs.writeFileSync("case_bateaux.json",JSON.stringify(grille), "utf-8"); //on utilise stringify pour reconvertir notre objet javascript en chaine JSON
	
	// AFFICHAGE DE LA PAGE placez_vos_bateaux.html
	page = fs.readFileSync('./html/placez_vos_bateaux.html', 'utf-8');

	marqueurs = {};
	marqueurs.code_partie = Math.floor(Math.random() * 100000);
	page = nunjucks.renderString(page, marqueurs);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;
