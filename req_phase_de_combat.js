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
const { chargerEtat, sauvegarderEtat, missilesRestants, DELAI_TIR_ORDINATEUR } = require("./combat_utils.js");

// fonction qui place aléatoirement un bateau de taille donnée dans une grille et qui renvoie la grille modifiée
// "bateaux", si fourni, reçoit la liste des cases occupées par chaque bateau placé (utile pour detecter les bateaux coulés)
const placer_bateau = function (taille, grille, bateaux) {
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
                    let positions = [];
                    for (let i = 0; i < taille; i++) {
                        grille[position + i] = "bateau_inconnu"; // on place le bateau
                        positions.push(position + i);
                    }
                    if (bateaux) {
                        bateaux.push(positions); // on mémorise les cases occupées par ce bateau
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
                    let positions = [];
                    for (let i = 0; i < taille; i++) {
                        grille[position + 10 * i] = "bateau_inconnu"; // on place le bateau
                        positions.push(position + 10 * i);
                    }
                    if (bateaux) {
                        bateaux.push(positions); // on mémorise les cases occupées par ce bateau
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
    grille.length = 100;
    for (let i = 0; i < grille.length; i++) { // on initialise la case à eau inconnue
        grille[i] = "eau_inconnu";
    }

    // ----------------- SAUVEGARDER LE PLACEMENT DES BATEAUX DU JOUEUR -----------------

    let bateauxJoueur = []; // liste des cases occupées par chaque bateau du joueur

    if (query.placement) { // si le placement envoyé par le joueur (drag and drop) est présent
        try {
            let placement = JSON.parse(query.placement); // tableau de tableaux de positions (une entrée par bateau)
            placement.forEach(positions => {
                positions.forEach(pos => {
                    grille[pos] = "bateau_inconnu"; // on place le bateau sur la grille du joueur
                });
                bateauxJoueur.push(positions);
            });
        } catch (e) {
            console.log("Erreur lors de la lecture du placement du joueur : " + e.message);
            bateauxJoueur = [];
        }
    }

    if (bateauxJoueur.length === 0) { // si le joueur n'a pas placé ses bateaux (secours), on les place aléatoirement
        grille = placer_bateau(2, grille, bateauxJoueur);
        grille = placer_bateau(3, grille, bateauxJoueur);
        grille = placer_bateau(3, grille, bateauxJoueur);
        grille = placer_bateau(4, grille, bateauxJoueur);
        grille = placer_bateau(5, grille, bateauxJoueur);
    }

    // on écrit le placement du joueur dans les fichiers json
    fs.writeFileSync(`./grilles/${query.code_partie}.json`, JSON.stringify(grille), 'utf-8');
    fs.writeFileSync(`./grilles/${query.code_partie}_bateaux.json`, JSON.stringify(bateauxJoueur), 'utf-8');

    // ----------------- GÉNÉRER LE PLACEMENT DES BATEAUX DE L'ORDINATEUR -----------------

    let grilleOrdinateur = [];
    grilleOrdinateur.length = 100;
    for (let i = 0; i < grilleOrdinateur.length; i++) { // on réinitialise le tableau grille
        grilleOrdinateur[i] = "eau_inconnu"; // on initialise la case à eau inconnue
    }

    let bateauxOrdinateur = []; // liste des cases occupées par chaque bateau de l'ordinateur

	grilleOrdinateur = placer_bateau(2, grilleOrdinateur, bateauxOrdinateur); // place un bateau de taille 2
	grilleOrdinateur = placer_bateau(3, grilleOrdinateur, bateauxOrdinateur); // place un bateau de taille 3
	grilleOrdinateur = placer_bateau(3, grilleOrdinateur, bateauxOrdinateur); // place un bateau de taille 3
	grilleOrdinateur = placer_bateau(4, grilleOrdinateur, bateauxOrdinateur); // place un bateau de taille 4
	grilleOrdinateur = placer_bateau(5, grilleOrdinateur, bateauxOrdinateur); // place un bateau de taille 5

    // Sauvegarder le tableau dans le fichier json
    fs.writeFileSync(`./grilles/ordinateur.json`, JSON.stringify(grilleOrdinateur), 'utf-8'); // on écrit le tableau grille dans le fichier json
    fs.writeFileSync(`./grilles/ordinateur_bateaux.json`, JSON.stringify(bateauxOrdinateur), 'utf-8'); // on écrit les cases occupées par chaque bateau

    // ----------------- DEMARRAGE DU CHRONO DU JOUEUR (la phase de combat commence, c'est à lui de jouer) -----------------

    let etat = chargerEtat(query.code_partie);
    etat.debut_tour_joueur = Date.now();
    etat.debut_tour_ordinateur = null;
    sauvegarderEtat(query.code_partie, etat);

    // ----------------- REDIRIGER VERS LA PAGE PHASE DE COMBAT -----------------

    let marqueurs = {};
    let page;

    //ON LIT LES FICHIERS EXISTANTS
    grille = JSON.parse(fs.readFileSync(`./grilles/${query.code_partie}.json`, "utf-8")); // on lit le fichier json

    // Pour la grille du joueur : l'état de chaque case correspond directement à la classe css à appliquer
    for (let i = 0; i < grille.length; i++) { // pour chaque case de la grille
        marqueurs[`J${i}`] = grille[i];
    }

    // Pour la grille de l'ordinateur : on initialise les marqueurs nunjucks a la classe css inconnu pour les cases de la grille de l'ordinateur
    for (let i = 0; i < grille.length; i++) { // pour chaque case de la grille
        marqueurs[`A${i}`] = "inconnu"; // on affecte la classe .inconnu au marqueur nunjucks OX
    }

    // AFFICHAGE DE LA PAGE phase_de_combat.html
    page = fs.readFileSync("./html/phase_de_combat.html", 'utf-8');

    marqueurs.pseudo = query.pseudo;
    marqueurs.password = query.password;
    marqueurs.code_partie = query.code_partie;
    marqueurs.erreur = "";
    marqueurs.score = etat.score;
    marqueurs.tour_ordinateur = false;
    marqueurs.delai_ordinateur = DELAI_TIR_ORDINATEUR;

    marqueurs.timer_actif = etat.options.timer;
    marqueurs.temps_restant_joueur = etat.temps_restant_joueur;

    marqueurs.missiles_actifs = etat.options.missiles;
    let restants = missilesRestants(etat, "joueur");
    marqueurs.trident_restant = restants.trident;
    marqueurs.mf_restant = restants.mf;
    marqueurs.m5_restant = restants.m5;

    page = nunjucks.renderString(page, marqueurs);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(page);
    res.end();
}

module.exports = trait;
