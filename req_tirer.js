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

const trait = function (req, res, query) {
	let marqueurs = {};
	let page;

	marqueurs.erreur = ""; // Aucune erreur pour le moment
    
    // ---------- Changer l’état de la case cliqué dans le json ----------

	let grille = JSON.parse(fs.readFileSync(`./grilles/ordinateur.json`, "UTF-8")); // Récupération de la grille

	let cible = query.cible; // Coordonnée de la case du tir

	console.log("---------" + grille[cible]);

	if (grille[cible] === "eau_inconnu") { // Si la case est de l'eau inconnue
		grille[cible] = "eau_connu"; // La case devient de l'eau connue car le joueur a tiré dessus
	}
	else if (grille[cible] === "bateau_inconnu") { // Si la case est un bateau inconnu
		grille[cible] = "bateau_touche"; // La case devient un bateau touché car le joueur a tiré dessus
	}
	else if (grille[cible] === "eau_connu" || grille[cible] === "bateau_touche" || grille[cible] === "bateau_coule") { // Si la case est de l'eau connue ou un bateau touché ou bateau coulé
		marqueurs.erreur = "Vous avez déjà tiré sur cette case !"; // Affiche un message d'erreur
	}

	fs.writeFileSync(`./grilles/ordinateur.json`, JSON.stringify(grille), "UTF-8"); // Enregistrement de la grille modifiée
	
	//ON LIT LES FICHIERS EXISTANTS
	grille = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "utf-8")); // on lit le fichier json

	// On affecte le placement des bateaux du joueur dans les marqueurs nunjucks
	for (let i = 0; i < grille.length; i++) { // pour chaque case de la grille
		if (grille[i] === "bateau_connu" || grille[i] === "bateau_inconnu") { // si la case est un bateau
			marqueurs[`J${i}`] = "bateau"; // on affecte la classe .bateau au marqueur nunjucks OX
		}
		else if (grille[i] === "eau_connu" || grille[i] === "eau_inconnu") { // si la case est de l'eau
			marqueurs[`J${i}`] = "eau"; // on affecte la classe .eau au marqueur nunjucks OX
		}
	}

	grille = JSON.parse(fs.readFileSync(`./grilles/ordinateur.json`, "utf-8")); // on lit le fichier json de l'ordinateur

	// On initialise les marqueurs nunjucks a la classe css inconnu pour les cases de la grille de l'ordinateur
	for (let i = 0; i < grille.length; i++) { // pour chaque case de la grille
		if (grille[i] === "bateau_touche") { // si la case est un bateau touche
			marqueurs[`A${i}`] = "bateau_touche"; // on affecte la classe .bateau_touche au marqueur nunjucks
		}
		else if (grille[i] === "eau_connu") { // si la case est de l'eau connue
			marqueurs[`A${i}`] = "eau"; // on affecte la classe .eau au marqueur nunjucks
		}
		else {
			marqueurs[`A${i}`] = "inconnu"; // on affecte la classe .inconnu au marqueur nunjucks
		}
	}		

	// ---------- Actualisation de la page ----------
	page = fs.readFileSync('./html/phase_de_combat.html', 'utf-8');

	marqueurs.pseudo = query.pseudo;
	marqueurs.password = query.password;
	marqueurs.code_partie = query.code_partie;

	page = nunjucks.renderString(page, marqueurs);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;