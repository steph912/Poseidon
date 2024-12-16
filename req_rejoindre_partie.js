const fs = require("fs");
const nunjucks = require("nunjucks");

const rejoindrePartie = function (req, res, query) {
    let marqueurs;
    let page;
    let contenu_fichier;
    let listeParties;
    let trouve;

    // ON LIT LES PARTIES EXISTANTES
    try {
        contenu_fichier = fs.readFileSync("parties.json", "utf-8");
        listeParties = JSON.parse(contenu_fichier);
    } catch (e) {
        listeParties = []; // Si le fichier est vide ou introuvable
    }

    // ON VERIFIE SI LE NOM DE LA PARTIE EXISTE
    trouve = false;
    for (let i = 0; i < listeParties.length; i++) {
        if (listeParties[i].name === query.codeAleatoire) {
            trouve = true;
            break;
        }
    }

    // ON RENVOIE UNE PAGE HTML
    if (trouve === false) {
        // SI LA PARTIE N'EXISTE PAS, ON REVIENT À LA PAGE D'ACCUEIL MEMBRE AVEC UNE ERREUR
        page = fs.readFileSync("accueil.html", "utf-8");

        marqueurs = {};
        marqueurs.erreur = "ERREUR : le code est introuvable.";
        marqueurs.codeAleatoire = query.codeAleatoire || ""; // Affiche le nom demandé s'il existe dans la requête
        page = nunjucks.renderString(page, marqueurs);
    } else {
        // SI LA PARTIE EXISTE, ON ENVOIE LA PAGE POUR JOUER
        page = fs.readFileSync("placez_vos_bateaux.html", "utf-8");

        marqueurs = {};
        marqueurs.codeAleatoire = query.codeAleatoire;
        page = nunjucks.renderString(page, marqueurs);
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(page);
    res.end();
};

module.exports = rejoindrePartie;
