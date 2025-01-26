/*
Requête Tirer :
   -SYSTÈME DE SÉLECTION DU MISSILE AVEC UN INPUT TYPE CHECKBOX DANS UN FORM ANDREI PRINCE
   -CHANGER L’ÉTAT DE LA CASE CLIQUÉ DANS LE JSON MATHIS 
   -ACTUALISER LA PAGE AVEC LE NOUVEL ETAT DE LA GRILLE AVEC LA QUERY COMPLÈTE ET MARQUEURS NUNJUCKS (PSEUDO, PASSWORD, CODE DE PARTIE, CASES DE LA GRILLE) STÉPHANE MATHIS 

Différents états des cases de la grille : 
- “eau_inconnu” : case eau que le joueur n’a pas découvert 
- “eau_connu” : case eau que le joueur a découvert en tirant 
- “bateau_inconnu” case bateau que le joueur n’a pas découvert 
- “bateau_touché” case bateau que le joueur a découvert en tirant dessus 
- “bateau_coulé” case bateau découverte, touché et coulé car toutes les cases du bateau ont été touchées (OPTIONEL MAIS PRESENT DANS LE JEU DE BASE) 

Différents classes css pour les cases de la grille :
- ".inconnu" : case que le joueur n’a pas découvert
- “.eau” : case eau que le joueur connait
- “.bateau” : case bateau que le joueur connait
- “.bateau_touche” : case bateau que le joueur a découvert en tirant dessus
- “.bateau_coule” : case bateau découverte, touché et coulé car toutes les cases du bateau ont été touchées (OPTIONEL MAIS PRESENT DANS LE JEU DE BASE)
*/
"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");

const tir = function (cible, grille, tir_joueur) {
	if (grille[cible] === "eau_inconnu") { // Si la case est de l'eau inconnue
		grille[cible] = "eau_connu"; // La case devient de l'eau connue car le joueur a tiré dessus
		tir_joueur = true;
	}
	else if (grille[cible] === "bateau_inconnu") { // Si la case est un bateau inconnu
		grille[cible] = "bateau_touche"; // La case devient un bateau touché car le joueur a tiré dessus
		tir_joueur = true;
	}
	else if (grille[cible] === "eau_connu" || grille[cible] === "bateau_touche" || grille[cible] === "bateau_coule") { // Si la case est de l'eau connue ou un bateau touché ou bateau coulé
		//marqueurs.erreur = "Vous avez déjà tiré sur cette case !"; // Affiche un message d'erreur
		console.log("erreur");
		tir_joueur = false;
	}
};

const verif_gagne = function (grille) {
	let gagne = true; // On suppose que le joueur a gagné
	for (let i = 0; i < grille.length; i++) { // Pour chaque case de la grille
		if (grille[i] === "bateau_inconnu") { // Si le joueur n'a pas découvert toutes les cases des bateaux
			gagne = false; // Le joueur n'a pas gagné
		}
	}
	return gagne;
}

const trait = function (req, res, query) {
	let marqueurs = {};
	let page;

	marqueurs.erreur = ""; // Aucune erreur pour le moment

    // ---------- Tir Joueur ----------

	let grille = JSON.parse(fs.readFileSync(`./grilles/ordinateur.json`, "UTF-8")); // Récupération de la grille

	let cible = Number(query.cible); // Coordonnée de la case du tir
	let missile = query.missile; // Type de missile
	let tir_joueur = false;
	
	if (missile === "m1") {
		tir(cible, grille, tir_joueur);
	}
	else if (missile === "m5") {
		tir(cible - 1, grille, tir_joueur); // On tire sur la case à gauche
		tir(cible + 1, grille, tir_joueur); // On tire sur la case à droite
		tir(cible - 10, grille, tir_joueur); // On tire sur la case en haut
		tir(cible + 10, grille, tir_joueur); // On tire sur la case en bas
		tir(cible, grille, tir_joueur); // On tire sur la case cible
	}
	else if (missile === "mf") {
		tir(cible + Math.floor(Math.random() * 5), grille, tir_joueur);
		tir(cible - Math.floor(Math.random() * 5), grille, tir_joueur);
		tir(cible + Math.floor(Math.random() * 10), grille, tir_joueur);
		tir(cible - Math.floor(Math.random() * 10), grille, tir_joueur);
		tir(cible + Math.floor(Math.random() * 20), grille, tir_joueur);
		tir(cible - Math.floor(Math.random() * 20), grille, tir_joueur);
	}
	else if (missile === "trident") {
		for (let i = cible - 20; i < cible + 20; i+= 10) {
			tir(cible + i, grille, tir_joueur); // On tire sur la case cible
			tir(cible + i - 1, grille, tir_joueur); // On tire sur la case à gauche
			tir(cible + i + 1, grille, tir_joueur); // On tire sur la case à droite
			tir(cible + i + 2, grille, tir_joueur);	// On tire sur la 2eme case à droite
		}
	}
	else {
		tir(cible, grille, tir_joueur);
		// tir_joueur = false;
	}

	fs.writeFileSync(`./grilles/ordinateur.json`, JSON.stringify(grille), "UTF-8"); // Enregistrement de la grille modifiée


	// ---------- Tir de l'ordinateur ----------

	if (tir_joueur) { // Si le joueur a tiré alors l'ordinateur tire
		grille = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "UTF-8")); // Récupération de la grille du joueur
		
		cible = Math.floor(Math.random() * grille.length); // Coordonnée de la case du tir de l'ordinateur

		if (grille[cible] === "eau_inconnu") { // Si la case est de l'eau inconnue
			grille[cible] = "eau_connu"; // La case devient de l'eau connue car le joueur a tiré dessus
		}
		else if (grille[cible] === "bateau_inconnu") { // Si la case est un bateau inconnu
			grille[cible] = "bateau_touche"; // La case devient un bateau touché car le joueur a tiré dessus
		}
		else if (grille[cible] === "eau_connu" || grille[cible] === "bateau_touche" || grille[cible] === "bateau_coule") { // Si la case est de l'eau connue ou un bateau touché ou bateau coulé
			marqueurs.erreur = "Vous avez déjà tiré sur cette case !"; // Affiche un message d'erreur
		}

		fs.writeFileSync(`./grilles/${query.code_partie}.json`, JSON.stringify(grille), "UTF-8"); // Enregistrement de la grille modifiée
	}

	// ---------- Affichage de la page ----------
	grille = JSON.parse(fs.readFileSync(`./grilles/ordinateur.json`, "utf-8")); // on lit le fichier json de l'ordinateur
	let verif_joueur = verif_gagne(grille);

	grille = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "utf-8")); // on lit le fichier json
	let verif_ordinateur = verif_gagne(grille);

	if (!verif_joueur && !verif_ordinateur) { // On vérifie si personne n'a gagner
		// Pour le joueur
		grille = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "utf-8")); // on lit le fichier json

		for (let i = 0; i < grille.length; i++) { // pour chaque case de la grille
			if (grille[i] === "bateau_inconnu") { // si la case est un bateau inconnu
				marqueurs[`J${i}`] = "bateau_inconnu"; // on affecte la classe .bateau au marqueur nunjucks OX
			}
			else if (grille[i] === "eau_inconnu") { // si la case est de l'eau
				marqueurs[`J${i}`] = "eau_inconnu"; // on affecte la classe .eau au marqueur nunjucks OX
			}
			else if (grille[i] === "bateau_touche") { // si la case est un bateau touche
				marqueurs[`J${i}`] = "bateau_touche"; // on affecte la classe .bateau_touche au marqueur nunjucks OX
			}
			else if (grille[i] === "eau_connu") { // si la case est de l'eau connue
				marqueurs[`J${i}`] = "eau_connu"; // on affecte la classe .eau_connu au marqueur nunjucks OX
			}
		}

		// Pour l'ordinateur
		grille = JSON.parse(fs.readFileSync(`./grilles/ordinateur.json`, "utf-8")); // on lit le fichier json de l'ordinateur

		for (let i = 0; i < grille.length; i++) { // pour chaque case de la grille
			if (grille[i] === "bateau_touche") { // si la case est un bateau touche
				marqueurs[`A${i}`] = "bateau_touche"; // on affecte la classe .bateau_touche au marqueur nunjucks
			}
			else if (grille[i] === "eau_connu") { // si la case est de l'eau connue
				marqueurs[`A${i}`] = "eau_connu"; // on affecte la classe .eau au marqueur nunjucks
			}
			else {
				marqueurs[`A${i}`] = "inconnu"; // on affecte la classe .inconnu au marqueur nunjucks
			}
		}

		page = fs.readFileSync('./html/phase_de_combat.html', 'utf-8');
	}
	else if (verif_joueur) {
		page = fs.readFileSync('./html/gagne.html', 'utf-8');
	}
	else if (verif_ordinateur) {
		page = fs.readFileSync('./html/perdu.html', 'utf-8');
	}

	// ---------- Actualisation de la page ----------
	marqueurs.pseudo = query.pseudo;
	marqueurs.password = query.password;
	marqueurs.code_partie = query.code_partie;

	page = nunjucks.renderString(page, marqueurs);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;