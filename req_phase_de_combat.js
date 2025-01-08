/* Requete phase de combat (quand on clique sur “j’ai terminé”)

    -Lire le placement des bateaux dans le html avec le js front (document. Read..)  

    -sauvegarder le placement des bateaux dans la grille json

    -génerer aléatoirement des emplacement de bateaux pour l'IA

    -rediriger vers la page phase de combat avec une query complete (pseudo, password, code_partie, grille)
*/
"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");

// fonction qui place aléatoirement un bateau de taille donnée dans une grille et qui renvoie la grille modifiée
const placer_bateau = function (taille, grille) {
    let direction = Math.floor(Math.random() * 2); // 0 pour horizontal, 1 pour vertical
	let position = Math.floor(Math.random() * grille.length); // position aléatoire de départ du bateau
	let bateau_place = false; // true si le bateau peut être placé, false sinon

	while (bateau_place === false) { // tant que le bateau n'est pas placé
        if (direction === 0) { // si le bateau est horizontal
            if (position % 10 + taille <= 10) { // si le bateau ne dépasse pas de la grille
                bateau_place = true;
                for (let i = 0; i < taille; i++) {
                    if (grille[position + i] !== undefined) { // si la case est déjà occupée
                        bateau_place = false;
                    }
                }
                if (bateau_place) { // si le bateau peut être placé
                    for (let i = 0; i < taille; i++) {
                        grille[position + i] = "bateau";
                    }
                }
            }
            else {
                direction = 1; // on change la direction du bateau
            }
        }
        if (direction === 1) { // si le bateau est vertical
            if (Math.floor(position / 10) + taille <= 10) { // si le bateau ne dépasse pas de la grille
                bateau_place = true; // true si le bateau peut être placé, false sinon
                for (let i = 0; i < taille; i++) {
                    if (grille[position + 10 * i] !== undefined) { // si la case est déjà occupée
                        bateau_place = false;
                    }
                }
                if (bateau_place) { // si le bateau peut être placé
                    for (let i = 0; i < taille; i++) {
                        grille[position + 10 * i] = "bateau";
                    }
                }
            }
            else {
                direction = 0; // on change la direction du bateau
            }
        }
    }
	return grille;
}

const trait = function (req, res, query) {

    // ----------------- GÉNÉRER LE PLACEMENT DES BATEAUX DE L'ORDINATEUR -----------------
    
    // Génerer le placement des bateaux aléatoirement dans un tableau une dimension

    let grille = []; // tableau contenant les cases de la grille
    grille.length = 99; // tableau de 100 cases
    let contenu_fichier;
    
	grille = placer_bateau(2, grille); // place un bateau de taille 2
	grille = placer_bateau(3, grille); // place un bateau de taille 3
	grille = placer_bateau(3, grille); // place un bateau de taille 3
	grille = placer_bateau(4, grille); // place un bateau de taille 4
	grille = placer_bateau(5, grille); // place un bateau de taille 5

    // Sauvegarder le tableau dans le fichier json

    contenu_fichier = JSON.stringify(grille); // transforme le tableau en texte
    fs.writeFileSync(`./grilles/ordinateur.json`, contenu_fichier, 'utf-8'); // écrit le texte dans le fichier json

    // ----------------- REDIRIGER VERS LA PAGE PHASE DE COMBAT -----------------

    let marqueurs = {};
    let page;

    //ON LIT LES FICHIERS EXISTANTS
    contenu_fichier = fs.readFileSync(`${query.code_partie}.json`, "utf-8") //on lit le fichier json qui sera une chaine de caractère
    grille = JSON.parse(contenu_fichier); // on convertit la chaine de caractère en objet java script (tableau quon appelle grille)

    // Affecter le placement des bateaux du joueur dans les marqueurs nunjucks

    for (let i = 0; i < grille.length; i++) { // pour chaque case de la grille
        if (grille[i] === "bateau") { // si la case contient un bateau
            marqueurs[`J${i}`] = ".bateau"; // on affecte la classe .bateaux au marqueur nunjucks J0, J1, J2, etc
        }
        else {
            marqueurs[`J${i}`] = ".eau"; // on affecte la classe .eau au marqueur nunjucks J0, J1, J2, etc
        }
    }
    
    // AFFICHAGE DE LA PAGE placez_vos_bateaux.html
    page = fs.readFileSync("./html/phase_de_combat.html", 'utf-8');

    marqueurs.pseudo = query.pseudo;
    marqueurs.password = query.password;
    marqueurs.code_partie = query.code_partie;
    marqueurs.erreur = "";

    page = nunjucks.renderString(page, marqueurs);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(page);
    res.end();
}

module.exports = trait;