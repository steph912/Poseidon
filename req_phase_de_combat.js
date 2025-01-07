/* Requete phase de combat (quand on clique sur “j’ai terminé”) :Mathis 

    -Lire le placement des bateaux dans le html avec le js front (document. Read..)  

    -sauvegarder le placement des bateaux dans la grille json 

    -rediriger vers la page phase de combat avec une query complete
*/
"use strict";

const fs = require("fs");
const nunjucks = require("nunjucks");


const trait = function (req, res, query) {

    // déclencher l'évenement de javascript front pour sauvegarder le placement des bateaux dans la grille json

   


    // ----------------- REDIRIGER VERS LA PAGE PHASE DE COMBAT -----------------

    let marqueurs;
    let page;
    let grille = []
    let i = 0;
    let résultat;
    grille.length = 99;
    let état = ["eau", "bateaux"]


    //ON LIT LES FICHIERS EXISTANTS
    const contenu_fichier = fs.readFileSync("case_bateaux.json", "utf-8") //on lit le fichier json qui sera une chaine de caractère
    grille = JSON.parse(contenu_fichier); // on convertit la chaine de caractère en objet java script (tableau quon appelle grille)

    //ON INITIALISE LE TABLEAU EN NE METTANT QUE DU BLEU

        while (i < grille.length) {
            résultat = état[0]; // Sélectionne un état aléatoire ("eau" ou "touché")
            grille[i] = résultat; // Stocke le résultat dans la grilleS		
            i++
        }
    //SI LE BATEAU PRENDS LES EMPLACEMENT DE LA GRILLE ON LEUR DONNE L'ETAT OCCUPE 
    
    // ON SAUVEGARDE LES FICHIERS EXISTANTS POUR PEUT ETRE LES UTILISER APRES 
    fs.writeFileSync("case_bateaux.json",JSON.stringify(grille), "utf-8"); //on utilise stringify pour reconvertir notre objet javascript en chaine JSON
    
    // AFFICHAGE DE LA PAGE placez_vos_bateaux.html
    page = fs.readFileSync("./html/phase_de_combat.html", 'utf-8');

    marqueurs = {};
    marqueurs.état = résultat ;// il yaura soit eau soit touché aux états 
    page = nunjucks.renderString(page, marqueurs);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(page);
    res.end();
};

module.exports = trait;

