/*
Requête Tirer (tir du JOUEUR uniquement — le tir de l'ordinateur est géré par req_tir_ordinateur.js, 2 secondes plus tard) :
   -SYSTÈME DE SÉLECTION DU MISSILE AVEC UN INPUT TYPE CHECKBOX DANS UN FORM ANDREI PRINCE
   -CHANGER L’ÉTAT DE LA CASE CLIQUÉ DANS LE JSON MATHIS
   -ACTUALISER LA PAGE AVEC LE NOUVEL ETAT DE LA GRILLE AVEC LA QUERY COMPLÈTE ET MARQUEURS NUNJUCKS (PSEUDO, PASSWORD, CODE DE PARTIE, CASES DE LA GRILLE) STÉPHANE MATHIS

Différents états des cases de la grille :
- “eau_inconnu” : case eau que le joueur n’a pas découvert
- “eau_connu” : case eau que le joueur a découvert en tirant
- “bateau_inconnu” case bateau que le joueur n’a pas découvert
- “bateau_touché” case bateau que le joueur a découvert en tirant dessus
- “bateau_coulé” case bateau découverte, touché et coulé car toutes les cases du bateau ont été touchées
*/
"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");
const {
	chargerEtat,
	sauvegarderEtat,
	missilesRestants,
	LIMITES_MISSILES,
	lireBateaux,
	appliquerMissile,
	marquerBateauxCoules,
	calculerScoreDelta,
	determinerSon,
	verifGagne,
	mettreAJourScore,
	obtenirScore,
	DELAI_TIR_ORDINATEUR,
} = require("./combat_utils.js");

// Construit les marqueurs J0..J99 / A0..A99 pour l'affichage d'une grille, en cachant les bateaux
// non découverts de l'adversaire ("coteAdversaire" = true)
const marqueursGrille = function (prefixe, grille, coteAdversaire) {
	let marqueurs = {};
	for (let i = 0; i < grille.length; i++) {
		if (!coteAdversaire) {
			marqueurs[`${prefixe}${i}`] = grille[i]; // grille du joueur : on affiche tout tel quel
		} else if (grille[i] === "bateau_touche" || grille[i] === "bateau_coule" || grille[i] === "eau_connu") {
			marqueurs[`${prefixe}${i}`] = grille[i];
		} else {
			marqueurs[`${prefixe}${i}`] = "inconnu"; // bateau_inconnu et eau_inconnu restent cachés
		}
	}
	return marqueurs;
};

const trait = function (req, res, query) {
	let marqueurs = {};
	let page;

	marqueurs.erreur = ""; // Aucune erreur pour le moment
	marqueurs.delai_ordinateur = DELAI_TIR_ORDINATEUR;
	marqueurs.pseudo = query.pseudo;
	marqueurs.password = query.password;
	marqueurs.code_partie = query.code_partie;

	let etat = chargerEtat(query.code_partie);

	// ---------- Gestion du chrono du joueur ----------

	if (etat.options.timer && etat.debut_tour_joueur) {
		let ecoule = Math.floor((Date.now() - etat.debut_tour_joueur) / 1000);
		let tempsRestant = etat.temps_restant_joueur - ecoule;

		if (tempsRestant <= 0) {
			// Le joueur n'a pas tiré à temps : il perd la partie
			etat.temps_restant_joueur = 0;
			sauvegarderEtat(query.code_partie, etat);

			let grilleJoueur = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "utf-8"));
			let grilleOrdinateur = JSON.parse(fs.readFileSync(`./grilles/ordinateur.json`, "utf-8"));

			marqueurs = Object.assign(marqueurs, marqueursGrille("J", grilleJoueur, false), marqueursGrille("A", grilleOrdinateur, false));
			marqueurs.score = obtenirScore(query.code_partie);
			marqueurs.erreur = "Temps écoulé !";

			page = fs.readFileSync('./html/perdu.html', 'utf-8');
			page = nunjucks.renderString(page, marqueurs);
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(page);
			res.end();
			return;
		}

		etat.temps_restant_joueur = tempsRestant;
	}

	// ---------- Vérification du quota de missiles spéciaux ----------

	let missile = query.missile || "m1";
	let restants = missilesRestants(etat, "joueur");

	if (!etat.options.missiles && missile !== "m1") {
		missile = "m1"; // les missiles spéciaux sont désactivés pour cette partie : on retombe sur le missile simple
	}

	if (["trident", "mf", "m5"].includes(missile) && restants[missile] <= 0) {
		// Le joueur n'a plus ce missile en stock : on ne consomme pas de tour, on réaffiche la page avec une erreur
		etat.debut_tour_joueur = Date.now(); // on relance son chrono pour qu'il choisisse un autre missile
		sauvegarderEtat(query.code_partie, etat);

		let grilleJoueur = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "utf-8"));
		let grilleOrdinateur = JSON.parse(fs.readFileSync(`./grilles/ordinateur.json`, "utf-8"));

		marqueurs = Object.assign(marqueurs, marqueursGrille("J", grilleJoueur, false), marqueursGrille("A", grilleOrdinateur, true));
		marqueurs.score = etat.score;
		marqueurs.erreur = "Vous n'avez plus de missile de ce type !";
		marqueurs.tour_ordinateur = false;
		marqueurs.timer_actif = etat.options.timer;
		marqueurs.temps_restant_joueur = etat.temps_restant_joueur;
		marqueurs.missiles_actifs = etat.options.missiles;
		marqueurs.trident_restant = restants.trident;
		marqueurs.mf_restant = restants.mf;
		marqueurs.m5_restant = restants.m5;

		page = fs.readFileSync('./html/phase_de_combat.html', 'utf-8');
		page = nunjucks.renderString(page, marqueurs);
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.write(page);
		res.end();
		return;
	}

	// ---------- Tir du joueur ----------

	let grille = JSON.parse(fs.readFileSync(`./grilles/ordinateur.json`, "UTF-8")); // Récupération de la grille adverse
	let cible = Number(query.cible); // Coordonnée de la case du tir

	let { resultats, toucheCentre } = appliquerMissile(missile, cible, grille);

	// Un tir n'est valide (consomme le tour) que s'il a révélé au moins une case nouvelle
	let tirValide = resultats.some(r => r.resultat === "touche" || r.resultat === "eau");

	if (!tirValide) {
		// Toutes les cases visées étaient déjà connues : le joueur peut retenter sans perdre son tour
		etat.debut_tour_joueur = Date.now();
		sauvegarderEtat(query.code_partie, etat);

		let grilleJoueur = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "utf-8"));

		marqueurs = Object.assign(marqueurs, marqueursGrille("J", grilleJoueur, false), marqueursGrille("A", grille, true));
		marqueurs.score = etat.score;
		marqueurs.erreur = "Vous avez déjà tiré sur cette case !";
		marqueurs.tour_ordinateur = false;
		marqueurs.timer_actif = etat.options.timer;
		marqueurs.temps_restant_joueur = etat.temps_restant_joueur;
		marqueurs.missiles_actifs = etat.options.missiles;
		marqueurs.trident_restant = restants.trident;
		marqueurs.mf_restant = restants.mf;
		marqueurs.m5_restant = restants.m5;

		page = fs.readFileSync('./html/phase_de_combat.html', 'utf-8');
		page = nunjucks.renderString(page, marqueurs);
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.write(page);
		res.end();
		return;
	}

	// Le tir est valide : on consomme le missile spécial choisi, on met à jour les bateaux coulés et le score
	if (["trident", "mf", "m5"].includes(missile)) {
		etat.missiles.joueur[missile]++;
	}

	let bateauxOrdinateur = lireBateaux(`./grilles/ordinateur_bateaux.json`);
	let nouvellementCoules = marquerBateauxCoules(grille, bateauxOrdinateur);

	let deltaScore = calculerScoreDelta(resultats, nouvellementCoules);
	etat.score = mettreAJourScore(query.code_partie, deltaScore);

	let son = determinerSon(resultats, nouvellementCoules);

	fs.writeFileSync(`./grilles/ordinateur.json`, JSON.stringify(grille), "UTF-8"); // Enregistrement de la grille modifiée

	// ---------- Le joueur a-t-il gagné ? ----------

	if (verifGagne(grille)) {
		etat.debut_tour_joueur = null;
		sauvegarderEtat(query.code_partie, etat);

		let grilleJoueur = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "utf-8"));

		marqueurs = Object.assign(marqueurs, marqueursGrille("J", grilleJoueur, false), marqueursGrille("A", grille, false));
		marqueurs.score = etat.score;
		marqueurs.son = son;

		page = fs.readFileSync('./html/gagne.html', 'utf-8');
		page = nunjucks.renderString(page, marqueurs);
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.write(page);
		res.end();
		return;
	}

	// ---------- La partie continue : on prépare le tour de l'ordinateur (déclenché côté client, 2s plus tard) ----------

	etat.debut_tour_ordinateur = Date.now();
	sauvegarderEtat(query.code_partie, etat);

	let grilleJoueur = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "utf-8"));

	marqueurs = Object.assign(marqueurs, marqueursGrille("J", grilleJoueur, false), marqueursGrille("A", grille, true));
	marqueurs.score = etat.score;
	marqueurs.son = son;
	marqueurs.tour_ordinateur = true; // déclenche, côté client, le tir de l'ordinateur après un délai

	marqueurs.timer_actif = etat.options.timer;
	marqueurs.temps_restant_joueur = etat.temps_restant_joueur;

	marqueurs.missiles_actifs = etat.options.missiles;
	let restantsApres = missilesRestants(etat, "joueur");
	marqueurs.trident_restant = restantsApres.trident;
	marqueurs.mf_restant = restantsApres.mf;
	marqueurs.m5_restant = restantsApres.m5;

	page = fs.readFileSync('./html/phase_de_combat.html', 'utf-8');
	page = nunjucks.renderString(page, marqueurs);
	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;
