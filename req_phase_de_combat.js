/* Requete phase de combat (quand on clique sur “j’ai terminé”)

    -Lire le placement des bateaux dans le html avec le js front (document. Read..)  

    -sauvegarder le placement des bateaux dans la grille json

    -génerer aléatoirement des emplacement de bateaux pour l'IA

    -rediriger vers la page phase de combat avec une query complete  et les marqueurs nunjucks (pseudo, password, code_partie, grille)

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

// fonction qui place aléatoirement un bateau de taille donnée dans une grille et qui renvoie la grille modifiée
const placer_bateau = function (taille, grille) {
    let direction = Math.floor(Math.random() * 2); // 0 pour horizontal, 1 pour vertical
	let position = Math.floor(Math.random() * grille.length); // position aléatoire de départ du bateau
	let peut_placer = false; // true si le bateau peut être placé, false sinon
    let bateau_placer = false; // définis si le bateau est placé ou non
    let maxAttempts = 100; // Limite de tentatives pour éviter les boucles infinies
    let attempts = 0; // nombre de tentatives

	while (bateau_placer === false && attempts < maxAttempts) { // tant que le bateau n'est pas placé
        attempts++;
        if (direction === 0) { // si le bateau est horizontal
            if (position % 10 + taille <= 10) { // si le bateau ne dépasse pas de la grille
                peut_placer = true;
                for (let i = 0; i < taille; i++) {
                    if (grille[position + i] !== "eau_inconnu") { // si la case est déjà occupée
                        peut_placer = false; // le bateau ne peut pas être placé
                    }
                }
                if (peut_placer) { // si le bateau peut être placé
                    for (let i = 0; i < taille; i++) {
                        grille[position + i] = "bateau_inconnu"; // on place le bateau
                    }
                    bateau_placer = true; // le bateau est placé on sort de la boucle
                }
            }
            else {
                direction = 1; // on change la direction du bateau
            }
        }
        if (direction === 1) { // si le bateau est vertical
            if (Math.floor(position / 10) + taille <= 10) { // si le bateau ne dépasse pas de la grille
                peut_placer = true; // true si le bateau peut être placé, false sinon
                for (let i = 0; i < taille; i++) {
                    if (grille[position + 10 * i] !== "eau_inconnu") { // si la case est déjà occupée
                        peut_placer = false; // le bateau ne peut pas être placé
                    }
                }
                if (peut_placer) { // si le bateau peut être placé
                    for (let i = 0; i < taille; i++) {
                        grille[position + 10 * i] = "bateau_inconnu"; // on place le bateau
                    }
                    bateau_placer = true; // le bateau est placé on sort de la boucle
                }
            }
            else {
                direction = 0; // on change la direction du bateau
            }
        }
    }
	return grille;
}

const trait = function (req, res, query) { // fonction principale du module

    let grille = []; // tableau contenant les cases de la grille
    grille.length = 100; // tableau de 100 cases

    // ----------------- SAUVEGARDER LE PLACEMENT DES BATEAUX DU JOUEUR -----------------

    

    // fs.writeFileSync(`./grilles/${query.code_partie}.json`, JSON.stringify(grille), 'utf-8'); // on écrit le tableau grille dans le fichier json

    

    // ----------------- GÉNÉRER LE PLACEMENT DES BATEAUX DE L'ORDINATEUR -----------------

    // on réinitialise le tableau grille
    for (let i = 0; i < grille.length; i++) { // pour chaque case de la grille
        grille[i] = "eau_inconnu"; // on initialise la case à eau inconnue
    }

	grille = placer_bateau(2, grille); // place un bateau de taille 2
	grille = placer_bateau(3, grille); // place un bateau de taille 3
	grille = placer_bateau(3, grille); // place un bateau de taille 3
	grille = placer_bateau(4, grille); // place un bateau de taille 4
	grille = placer_bateau(5, grille); // place un bateau de taille 5

    // Sauvegarder le tableau dans le fichier json
    fs.writeFileSync(`./grilles/ordinateur.json`, JSON.stringify(grille), 'utf-8'); // on écrit le tableau grille dans le fichier json

    // Temporaire----------------------
    // on réinitialise le tableau grille
    for (let i = 0; i < grille.length; i++) { // pour chaque case de la grille
        grille[i] = "eau_inconnu"; // on initialise la case à eau inconnue
    }
	grille = placer_bateau(2, grille); // place un bateau de taille 2
	grille = placer_bateau(3, grille); // place un bateau de taille 3
	grille = placer_bateau(3, grille); // place un bateau de taille 3
	grille = placer_bateau(4, grille); // place un bateau de taille 4
	grille = placer_bateau(5, grille); // place un bateau de taille 5
    fs.writeFileSync(`./grilles/${query.code_partie}.json`, JSON.stringify(grille), 'utf-8'); // on écrit le tableau grille dans le fichier json
    // Temporaire----------------------

    // ----------------- REDIRIGER VERS LA PAGE PHASE DE COMBAT -----------------

    let marqueurs = {};
    let page;

    //ON LIT LES FICHIERS EXISTANTS
    grille = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "utf-8")); // on lit le fichier json

    // Pour la grille du joueur
    for (let i = 0; i < grille.length; i++) { // pour chaque case de la grille
        if (grille[i] === "bateau_inconnu") { // si la case est un bateau inconnu
            marqueurs[`J${i}`] = "bateau_inconnu"; // on affecte la classe .bateau_inconnu au marqueur nunjucks OX
        }
        else if (grille[i] === "eau_inconnu") { // si la case est de l'eau connue
            marqueurs[`J${i}`] = "eau_inconnu"; // on affecte la classe .eau_connu au marqueur nunjucks OX
        }
        else if (grille[i] === "bateau_touche") { // si la case est un bateau touche
            marqueurs[`J${i}`] = "bateau_touche"; // on affecte la classe .bateau_touche au marqueur nunjucks OX
        }
        else if (grille[i] === "eau_connu") { // si la case est de l'eau connue
            marqueurs[`J${i}`] = "eau_connu"; // on affecte la classe .eau au marqueur nunjucks OX
        }
    }

    // Pour la grille de l'ordinateur : on initialise les marqueurs nunjucks a la classe css inconnu pour les cases de la grille de l'ordinateur
    for (let i = 0; i < grille.length; i++) { // pour chaque case de la grille
        marqueurs[`A${i}`] = "inconnu"; // on affecte la classe .inconnu au marqueur nunjucks OX
    }

    let parties = JSON.parse(fs.readFileSync("parties.json", 'utf-8'));
    /* soit on vérifie chaque partie pour trouver le score
    for (let i = 0; i < parties.length; i++) {
        if (parties[i].code == query.code_partie) {
            marqueurs.score = parties[i].score;
        }
    }*/
    marqueurs.score = parties[parties.length - 1].score; // soit on prend la dernière partie pour récuperer le score
    
    // AFFICHAGE DE LA PAGE phase_de_combat.html
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