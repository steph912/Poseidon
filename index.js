// Site WEB demo PI

"use strict";

const http = require("http");
const url = require("url");
let mon_serveur;
let port;

// DECLARATION DES DIFFERENTS MODULES CORRESPONDANT A CHAQUE ACTION

const req_commencer = require("./req_commencer.js");
const req_creer_un_compte = require("./req_creer_un_compte.js");
const req_inscription = require("./req_inscription.js");
const req_connexion = require("./req_connexion.js");
const req_jouer_contre_ordinateur = require("./req_jouer_contre_ordinateur.js");
const req_options = require("./req_options.js");
const req_jouer_en_ligne = require("./req_jouer_en_ligne.js");
const req_a_propos = require("./req_a_propos.js");
const req_acceuil = require("./req_acceuil.js");
const req_creer_une_partie = require("./req_creer_une_partie.js");
const req_statique = require("./req_statique.js");
const req_phase_de_combat = require("./req_phase_de_combat.js");
const req_erreur = require("./req_erreur.js");
const req_tirer = require("./req_tirer.js");

// FONCTION DE CALLBACK APPELLEE POUR CHAQUE REQUETE

const traite_requete = function (req, res) {

	let requete;
	let pathname;
	let query;

	console.log("URL reçue : " + req.url);
	requete = url.parse(req.url, true);
	pathname = requete.pathname;
	query = requete.query;

	// ROUTEUR

	try {
		switch (pathname) {
			case '/':
			case '/req_commencer':
				req_commencer(req, res, query);
				break;
			case '/req_creer_un_compte':
				req_creer_un_compte(req, res, query);
				break;
			case '/req_inscription':
				req_inscription(req, res, query);
				break;
			case '/req_connexion':
				req_connexion(req, res, query);
				break;
			case '/req_jouer_contre_ordinateur':
				req_jouer_contre_ordinateur(req, res, query);
				break;
			case '/req_options':
				req_options(req, res, query);
				break;
			case '/req_jouer_en_ligne':
				req_jouer_en_ligne(req, res, query);
				break;
			case '/req_a_propos':
				req_a_propos(req, res, query);
				break;
			case '/req_acceuil':
				req_acceuil(req, res, query);
				break;
			case '/req_creer_une_partie':
				req_creer_une_partie(req, res, query);
				break;
			case '/req_phase_de_combat':
				req_phase_de_combat(req, res, query);
				break;
			case '/tirer':
				req_tirer(req, res, query);
				break;
			default:
				req_statique(req, res, query);
				break;
		}
	} catch (e) {
		console.log('Erreur : ' + e.stack);
		console.log('Erreur : ' + e.message);
		// console.trace();
		req_erreur(req, res, query);
	}
};

// CREATION ET LANCEMENT DU SERVEUR

mon_serveur = http.createServer(traite_requete);
port = 5000;
// Pour récupérer le numéro du port depuis la ligne de commande. Exemple : node index.js 5000
// port = process.argv[2];
console.log("Serveur en ecoute sur port " + port);
mon_serveur.listen(port);
