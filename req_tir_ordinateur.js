/*
Requête tir de l'ordinateur : appelée automatiquement par le client (script inline dans phase_de_combat.html),
2 secondes après que le joueur a lui-même tiré.

Niveaux d'IA :
- facile     : tire uniquement au hasard
- normal     : tire au hasard, puis vise les cases voisines d'un bateau touché jusqu'à le couler
- difficile  : comme "normal", mais 1 tir sur 3 utilise un missile spécial choisi au hasard (si le stock le permet)
*/
"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");
const {
	chargerEtat,
	sauvegarderEtat,
	missilesRestants,
	lireBateaux,
	appliquerMissile,
	marquerBateauxCoules,
	determinerSon,
	verifGagne,
	voisins,
	obtenirScore,
	DELAI_TIR_ORDINATEUR,
} = require("./combat_utils.js");

const marqueursGrille = function (prefixe, grille, coteAdversaire) {
	let marqueurs = {};
	for (let i = 0; i < grille.length; i++) {
		if (!coteAdversaire) {
			marqueurs[`${prefixe}${i}`] = grille[i];
		} else if (grille[i] === "bateau_touche" || grille[i] === "bateau_coule" || grille[i] === "eau_connu") {
			marqueurs[`${prefixe}${i}`] = grille[i];
		} else {
			marqueurs[`${prefixe}${i}`] = "inconnu";
		}
	}
	return marqueurs;
};

// Choisit la prochaine case à viser : en priorité dans la pile de chasse (voisins d'un bateau touché non coulé),
// sinon une case non découverte au hasard.
const choisirCible = function (grille, pileCibles) {
	while (pileCibles.length > 0) {
		let c = pileCibles.shift();
		if (grille[c] === "eau_inconnu" || grille[c] === "bateau_inconnu") {
			return c;
		}
	}
	let c;
	let tentatives = 0;
	do {
		c = Math.floor(Math.random() * grille.length);
		tentatives++;
	} while (!(grille[c] === "eau_inconnu" || grille[c] === "bateau_inconnu") && tentatives < 500);
	return c;
};

// Choisit un missile spécial disponible (stock non épuisé) au hasard, ou "m1" si aucun n'est disponible
const choisirMissileSpecial = function (restants) {
	let disponibles = Object.keys(restants).filter(type => restants[type] > 0);
	if (disponibles.length === 0) {
		return "m1";
	}
	return disponibles[Math.floor(Math.random() * disponibles.length)];
};

const trait = function (req, res, query) {
	let marqueurs = {};
	let page;

	marqueurs.pseudo = query.pseudo;
	marqueurs.password = query.password;
	marqueurs.code_partie = query.code_partie;
	marqueurs.erreur = "";
	marqueurs.delai_ordinateur = DELAI_TIR_ORDINATEUR;

	let etat = chargerEtat(query.code_partie);

	// ---------- Gestion du chrono de l'ordinateur ----------

	if (etat.options.timer && etat.debut_tour_ordinateur) {
		let ecoule = Math.floor((Date.now() - etat.debut_tour_ordinateur) / 1000);
		let tempsRestant = etat.temps_restant_ordinateur - ecoule;

		if (tempsRestant <= 0) {
			// L'ordinateur n'a pas tiré à temps : le joueur gagne
			etat.temps_restant_ordinateur = 0;
			sauvegarderEtat(query.code_partie, etat);

			let grilleJoueur = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "utf-8"));
			let grilleOrdinateur = JSON.parse(fs.readFileSync(`./grilles/ordinateur.json`, "utf-8"));

			marqueurs = Object.assign(marqueurs, marqueursGrille("J", grilleJoueur, false), marqueursGrille("A", grilleOrdinateur, false));
			marqueurs.score = obtenirScore(query.code_partie);

			page = fs.readFileSync('./html/gagne.html', 'utf-8');
			page = nunjucks.renderString(page, marqueurs);
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(page);
			res.end();
			return;
		}

		etat.temps_restant_ordinateur = tempsRestant;
	}

	// ---------- Choix de l'arme (missile spécial 1 tir sur 3 en difficile) ----------

	let missile = "m1";
	if (etat.options.niveau_ia === "difficile" && etat.options.missiles) {
		let prochainTir = etat.ia.nb_tirs + 1;
		if (prochainTir % 3 === 0) {
			missile = choisirMissileSpecial(missilesRestants(etat, "ordinateur"));
		}
	}

	// ---------- Choix de la cible ----------

	let grille = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "UTF-8")); // grille du joueur
	let cible;

	if (etat.options.niveau_ia === "facile") {
		cible = choisirCible(grille, []); // toujours au hasard, jamais de chasse
	} else {
		cible = choisirCible(grille, etat.ia.pile_cibles);
	}

	let { resultats, toucheCentre } = appliquerMissile(missile, cible, grille);

	if (["trident", "mf", "m5"].includes(missile)) {
		etat.missiles.ordinateur[missile]++;
	}

	let bateauxJoueur = lireBateaux(`./grilles/${query.code_partie}_bateaux.json`);
	let nouvellementCoules = marquerBateauxCoules(grille, bateauxJoueur);
	let son = determinerSon(resultats, nouvellementCoules);

	// ---------- Mise à jour de la chasse (uniquement pour normal / difficile) ----------

	if (etat.options.niveau_ia !== "facile") {
		if (toucheCentre) {
			let couleCetteFois = nouvellementCoules.some(positions => positions.includes(cible));
			if (couleCetteFois) {
				etat.ia.pile_cibles = []; // bateau coulé : on arrête de le chasser
			} else {
				let candidats = voisins(cible, false).filter(v => (grille[v] === "eau_inconnu" || grille[v] === "bateau_inconnu") && !etat.ia.pile_cibles.includes(v));
				etat.ia.pile_cibles = etat.ia.pile_cibles.concat(candidats);
			}
		}
	}

	etat.ia.nb_tirs++;
	fs.writeFileSync(`./grilles/${query.code_partie}.json`, JSON.stringify(grille), "UTF-8");

	// ---------- L'ordinateur a-t-il gagné ? ----------

	if (verifGagne(grille)) {
		etat.debut_tour_ordinateur = null;
		sauvegarderEtat(query.code_partie, etat);

		let grilleOrdinateur = JSON.parse(fs.readFileSync(`./grilles/ordinateur.json`, "utf-8"));

		marqueurs = Object.assign(marqueurs, marqueursGrille("J", grille, false), marqueursGrille("A", grilleOrdinateur, false));
		marqueurs.score = obtenirScore(query.code_partie);
		marqueurs.son = son;

		page = fs.readFileSync('./html/perdu.html', 'utf-8');
		page = nunjucks.renderString(page, marqueurs);
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.write(page);
		res.end();
		return;
	}

	// ---------- La partie continue : c'est de nouveau au joueur de jouer ----------

	etat.debut_tour_joueur = Date.now();
	etat.debut_tour_ordinateur = null;
	sauvegarderEtat(query.code_partie, etat);

	let grilleOrdinateur = JSON.parse(fs.readFileSync(`./grilles/ordinateur.json`, "utf-8"));

	marqueurs = Object.assign(marqueurs, marqueursGrille("J", grille, false), marqueursGrille("A", grilleOrdinateur, true));
	marqueurs.score = etat.score;
	marqueurs.son = son;
	marqueurs.tour_ordinateur = false;

	marqueurs.timer_actif = etat.options.timer;
	marqueurs.temps_restant_joueur = etat.temps_restant_joueur;

	marqueurs.missiles_actifs = etat.options.missiles;
	let restants = missilesRestants(etat, "joueur");
	marqueurs.trident_restant = restants.trident;
	marqueurs.mf_restant = restants.mf;
	marqueurs.m5_restant = restants.m5;

	page = fs.readFileSync('./html/phase_de_combat.html', 'utf-8');
	page = nunjucks.renderString(page, marqueurs);
	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;
