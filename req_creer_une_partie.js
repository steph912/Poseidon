// Traitement de "req_creer_une_partie"

"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");;

const trait = function (req, res, query) {

	let marqueurs;
	let page;
	let nouvellePartie;
	let contenu_fichier;
	let listeParties;
	let i;
	let trouve;
	let motsDePasse = [];

    let motDePasse = Math.floor(Math.random() * 900000); 
    motsDePasse.push(motDePasse); 

	contenu_fichier = JSON.stringify(motsDePasse);
	fs.writeFileSync("parties.json", contenu_fichier, 'utf-8');




	// ON LIT LES CODE EXISTANTS

	contenu_fichier = fs.readFileSync("parties.json", 'utf-8');
	listeParties = JSON.parse(contenu_fichier);

	// ON VERIFIE QUE LE CODE N'EXISTE PAS DEJA

	trouve = false;
	i = 0;
	while (i < listeParties.length && trouve === false) {
		if (listeParties[i].pseudo === query.pseudo) {
			trouve = true;
		}
		i++;
	}

	// SI PAS TROUVE, ON AJOUTE LE NOUVEAU COMPTE DANS LA LISTE DES COMPTES

 if(trouve === false) {
		nouvellePartie = {};
		nouvellePartie.pseudo = query.pseudo;
	
		listeParties[listeParties.length] = nouvellePartie;
		
		contenu_fichier = JSON.stringify(listeParties);
		fs.writeFileSync("parties.json", contenu_fichier, 'utf-8');
		
	}

	// ON LIT LES PARTIES EXISTANTS

	contenu_fichier = fs.readFileSync("parties.json", 'utf-8');
	listeMembres = JSON.parse(contenu_fichier);

	if (trouve === true) {
		// SI CREATION PAS OK, ON REAFFICHE PAGE FORMULAIRE AVEC ERREUR

		page = fs.readFileSync('./html/jouer_contre_un_joueur.html', 'utf-8');
       
		marqueurs = {};
		marqueurs.erreur = "ERREUR, le code suivant existe déjà : ";
		marqueurs.pseudo = query.pseudo;
		page = nunjucks.renderString(page, marqueurs);

	} else {
	// SI CREATION OK, ON RENVOIE SUR LA PAGE ATTENTE DU JOUEUR 
		page = fs.readFileSync('./html/attente_du_joueur.html', 'UTF-8');

		marqueurs = {};
		marqueurs.pseudo = query.pseudo;
		
		page = nunjucks.renderString(page, marqueurs);
	}
	

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();

}

module.exports = trait;
