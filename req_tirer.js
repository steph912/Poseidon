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
    
    // ---------- Changer l’état de la case cliqué dans le json ----------

	let grille = JSON.parse(fs.readFileSync("./json/" + query.code_partie + ".json", "UTF-8")); // Récupération de la grille

	let cible = query.cible; // Coordonnée de la case du tir
	let contenu_cible = grille[cible]; // Contenu de la case du tir

	if (contenu_cible === "eau_inconnu") { // Si la case est de l'eau inconnue
		contenu_cible = "eau_connu"; // La case devient de l'eau connue car le joueur a tiré dessus
	}
	else if (contenu_cible === "bateau_inconnu") { // Si la case est un bateau inconnu
		contenu_cible = "bateau_touche"; // La case devient un bateau touché car le joueur a tiré dessus
	}
	else if (contenu_cible === "eau_connu" || contenu_cible === "bateau_touche" || contenu_cible === "bateau_coule") { // Si la case est de l'eau connue ou un bateau touché ou bateau coulé
		marqueurs.erreur = "Vous avez déjà tiré sur cette case !"; // Affiche un message d'erreur
	}

	fs.writeFileSync("./json/" + query.code_partie + ".json", JSON.stringify(grille), "UTF-8"); // Enregistrement de la grille modifiée

	// ---------- Actualisation de la page ----------
	page = fs.readFileSync('./html/phase_de_combat.html', 'utf-8');

	marqueurs.pseudo = query.pseudo;
	marqueurs.password = query.password;
	marqueurs.code_partie = query.code_partie;
	marqueurs.erreur = "";

	page = nunjucks.renderString(page, marqueurs);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write(page);
	res.end();
};

module.exports = trait;