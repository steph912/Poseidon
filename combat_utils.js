// Fonctions partagées entre req_tirer.js (tir du joueur) et req_tir_ordinateur.js (tir de l'IA)
"use strict";

const fs = require("fs");

// ----------------- CONSTANTES -----------------

// Nombre maximum d'utilisations de chaque missile spécial, par joueur, pour une partie
const LIMITES_MISSILES = {
	trident: 1,
	mf: 2, // missile à fragmentation
	m5: 3, // missile balistique
};

const TEMPS_INITIAL = 180; // 3 minutes, en secondes
const DELAI_TIR_ORDINATEUR = 2000; // 2 secondes avant que l'ordinateur ne joue

const SCORE_INITIAL = 1000;
const POINTS_TOUCHE = 100;
const POINTS_COULE = 250;
const POINTS_EAU = -20;

// ----------------- ETAT DE LA PARTIE (./grilles/<code>_etat.json) -----------------

const cheminEtat = function (codePartie) {
	return `./grilles/${codePartie}_etat.json`;
};

const etatParDefaut = function (options) {
	return {
		options: {
			timer: !!(options && options.timer),
			missiles: options && options.missiles !== undefined ? !!options.missiles : true,
			niveau_ia: (options && options.niveau_ia) || "facile",
		},
		score: SCORE_INITIAL,
		temps_restant_joueur: TEMPS_INITIAL,
		temps_restant_ordinateur: TEMPS_INITIAL,
		debut_tour_joueur: null,
		debut_tour_ordinateur: null,
		missiles: {
			joueur: { trident: 0, mf: 0, m5: 0 },
			ordinateur: { trident: 0, mf: 0, m5: 0 },
		},
		ia: {
			mode: "random", // 'random' ou 'chasse'
			pile_cibles: [], // cases candidates à essayer en priorité (bateau touché non coulé)
			nb_tirs: 0,
		},
	};
};

const chargerEtat = function (codePartie, options) {
	try {
		let etat = JSON.parse(fs.readFileSync(cheminEtat(codePartie), "utf-8"));
		// on complète les champs manquants avec les valeurs par défaut (compatibilité anciennes parties)
		let defaut = etatParDefaut(options);
		return Object.assign({}, defaut, etat, {
			options: Object.assign({}, defaut.options, etat.options),
			missiles: Object.assign({}, defaut.missiles, etat.missiles),
			ia: Object.assign({}, defaut.ia, etat.ia),
		});
	} catch (e) {
		return etatParDefaut(options);
	}
};

const sauvegarderEtat = function (codePartie, etat) {
	fs.writeFileSync(cheminEtat(codePartie), JSON.stringify(etat), "utf-8");
};

// Renvoie, pour chaque missile spécial, le nombre d'utilisations restantes pour un joueur donné
// L'ordinateur dispose de missiles spéciaux illimités : seul le joueur est soumis aux quotas de LIMITES_MISSILES
const missilesRestants = function (etat, joueur) {
	if (joueur === "ordinateur") {
		return { trident: Infinity, mf: Infinity, m5: Infinity };
	}
	let utilises = etat.missiles[joueur];
	return {
		trident: Math.max(0, LIMITES_MISSILES.trident - utilises.trident),
		mf: Math.max(0, LIMITES_MISSILES.mf - utilises.mf),
		m5: Math.max(0, LIMITES_MISSILES.m5 - utilises.m5),
	};
};

// ----------------- BATEAUX -----------------

const lireBateaux = function (chemin) {
	try {
		return JSON.parse(fs.readFileSync(chemin, "utf-8"));
	} catch (e) {
		return [];
	}
};

// Marque comme "bateau_coule" tous les bateaux entièrement touchés.
// Renvoie la liste des bateaux qui viennent JUSTE d'être coulés par cet appel (pour le calcul du score).
const marquerBateauxCoules = function (grille, bateaux) {
	let nouvellementCoules = [];
	bateaux.forEach(positions => {
		let dejaCoule = positions.every(pos => grille[pos] === "bateau_coule");
		if (dejaCoule) {
			return;
		}
		let entierementTouche = positions.length > 0 && positions.every(pos => grille[pos] === "bateau_touche" || grille[pos] === "bateau_coule");
		if (entierementTouche) {
			positions.forEach(pos => {
				grille[pos] = "bateau_coule";
			});
			nouvellementCoules.push(positions);
		}
	});
	return nouvellementCoules;
};

const verifGagne = function (grille) {
	for (let i = 0; i < grille.length; i++) {
		if (grille[i] === "bateau_inconnu" || grille[i] === "bateau_touche") {
			return false;
		}
	}
	return true;
};

// ----------------- TIRS -----------------

// Tire sur une case précise. Renvoie 'touche', 'eau' ou 'deja_connu'
const tirerCase = function (cible, grille) {
	if (cible < 0 || cible >= grille.length) {
		return "hors_grille";
	}
	if (grille[cible] === "eau_inconnu") {
		grille[cible] = "eau_connu";
		return "eau";
	}
	if (grille[cible] === "bateau_inconnu") {
		grille[cible] = "bateau_touche";
		return "touche";
	}
	return "deja_connu"; // eau_connu, bateau_touche ou bateau_coule
};

// Renvoie les voisins valides (dans la grille, 10x10) autour d'une case, sans retour à la ligne
const voisins = function (cible, diagonales) {
	let liste = [];
	let ligne = Math.floor(cible / 10);
	let colonne = cible % 10;

	const ajoute = function (dl, dc) {
		let l = ligne + dl;
		let c = colonne + dc;
		if (l >= 0 && l < 10 && c >= 0 && c < 10) {
			liste.push(l * 10 + c);
		}
	};

	ajoute(-1, 0);
	ajoute(1, 0);
	ajoute(0, -1);
	ajoute(0, 1);
	if (diagonales) {
		ajoute(-1, -1);
		ajoute(-1, 1);
		ajoute(1, -1);
		ajoute(1, 1);
	}
	return liste;
};

// Mélange un tableau (Fisher-Yates)
const melanger = function (tableau) {
	let copie = tableau.slice();
	for (let i = copie.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		[copie[i], copie[j]] = [copie[j], copie[i]];
	}
	return copie;
};

// Applique un missile sur la grille. Renvoie { resultats: [{pos, resultat}], toucheCentre: bool }
const appliquerMissile = function (missile, cible, grille) {
	let cases;

	if (missile === "m5") { // missile balistique : croix (centre + haut/bas/gauche/droite)
		cases = [cible].concat(voisins(cible, false));
	} else if (missile === "mf") { // missile à fragmentation : centre + quelques cases voisines aléatoires
		let candidats = melanger(voisins(cible, true));
		cases = [cible].concat(candidats.slice(0, 4));
	} else if (missile === "trident") { // trident : zone 3x3 complète
		cases = [cible].concat(voisins(cible, true));
	} else { // m1 / missile simple : une seule case
		cases = [cible];
	}

	let resultats = [];
	let toucheCentre = false;
	let dejaVues = new Set();

	cases.forEach(pos => {
		if (dejaVues.has(pos)) {
			return;
		}
		dejaVues.add(pos);
		let resultat = tirerCase(pos, grille);
		if (resultat !== "hors_grille") {
			resultats.push({ pos, resultat });
			if (pos === cible && resultat === "touche") {
				toucheCentre = true;
			}
		}
	});

	return { resultats, toucheCentre };
};

// Calcule le gain/perte de points d'un tir, à partir des résultats de appliquerMissile() et des bateaux nouvellement coulés
const calculerScoreDelta = function (resultats, nouvellementCoules) {
	let delta = 0;
	resultats.forEach(r => {
		if (r.resultat === "touche") {
			delta += POINTS_TOUCHE;
		} else if (r.resultat === "eau") {
			delta += POINTS_EAU;
		}
	});
	delta += nouvellementCoules.length * POINTS_COULE;
	return delta;
};

// Détermine quel effet sonore jouer pour un tir : "coule" (grosse explosion) > "touche" (petite explosion) > "eau" (plouf)
const determinerSon = function (resultats, nouvellementCoules) {
	if (nouvellementCoules.length > 0) {
		return "coule";
	}
	if (resultats.some(r => r.resultat === "touche")) {
		return "touche";
	}
	return "eau";
};

// ----------------- SCORE / CLASSEMENT (parties.json) -----------------

// Ajoute deltaScore au score de la partie "codePartie" dans parties.json, et renvoie le nouveau score (jamais négatif)
const mettreAJourScore = function (codePartie, deltaScore) {
	let parties = JSON.parse(fs.readFileSync("parties.json", "utf-8"));
	let partie = parties.find(p => Number(p.code) === Number(codePartie));
	let nouveauScore = SCORE_INITIAL;
	if (partie) {
		nouveauScore = Math.max(0, (partie.score || 0) + deltaScore);
		partie.score = nouveauScore;
		partie.date = new Date().toLocaleDateString("fr-FR");
		fs.writeFileSync("parties.json", JSON.stringify(parties), "utf-8");
	}
	return nouveauScore;
};

const obtenirScore = function (codePartie) {
	let parties = JSON.parse(fs.readFileSync("parties.json", "utf-8"));
	let partie = parties.find(p => Number(p.code) === Number(codePartie));
	return partie ? partie.score : SCORE_INITIAL;
};

// Renvoie le top N des parties (pour le classement), triées par score décroissant
const obtenirClassement = function (limite) {
	let parties = JSON.parse(fs.readFileSync("parties.json", "utf-8"));
	return parties
		.filter(p => p.joueur && typeof p.score === "number")
		.sort((a, b) => b.score - a.score)
		.slice(0, limite || 10);
};

// Interprète la valeur d'une case à cocher venant d'un formulaire GET.
// Grâce à un champ caché "value=off" placé avant la case à cocher dans le HTML, le navigateur envoie :
//  - rien (undefined) si la page n'a jamais été visitée
//  - "off" seul si la case a été décochée
//  - ["off", "on"] si la case a été cochée
const interpreterCheckbox = function (valeur, defautSiAbsent) {
	if (valeur === undefined) {
		return defautSiAbsent;
	}
	if (Array.isArray(valeur)) {
		return valeur.includes("on");
	}
	return valeur === "on";
};

module.exports = {
	LIMITES_MISSILES,
	interpreterCheckbox,
	voisins,
	TEMPS_INITIAL,
	DELAI_TIR_ORDINATEUR,
	chargerEtat,
	sauvegarderEtat,
	missilesRestants,
	lireBateaux,
	marquerBateauxCoules,
	verifGagne,
	tirerCase,
	appliquerMissile,
	calculerScoreDelta,
	determinerSon,
	mettreAJourScore,
	obtenirScore,
	obtenirClassement,
};
