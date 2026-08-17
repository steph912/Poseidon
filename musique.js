// Musique de fond du jeu, commune à toutes les pages.
// La catégorie de musique à jouer est indiquée par l'attribut data-musique du <body> :
//   "menu"        -> en dehors d'une partie (accueil, options, classement, connexion, gagné, perdu...)
//   "preparation" -> phase "Placez vos bateaux"
//   "combat"      -> phase de combat
(function () {
	"use strict";

	var PISTES = {
		menu: "/sons/musique_menu.mp3",
		preparation: "/sons/musique_preparation.mp3",
		combat: "/sons/musique_combat.mp3",
	};

	var categorie = document.body.dataset.musique || "menu";
	var src = PISTES[categorie] || PISTES.menu;

	var coupe = sessionStorage.getItem("musique_coupee") === "1";

	var audio = document.createElement("audio");
	audio.id = "musique-fond";
	audio.loop = true;
	audio.volume = 0.4;
	audio.src = src;
	audio.muted = coupe;
	document.body.appendChild(audio);

	// On essaie de reprendre la musique là où elle en était, si on reste dans la même catégorie
	// (par exemple en naviguant entre l'accueil et les options).
	var derniereCategorie = sessionStorage.getItem("musique_categorie");
	var dernierTemps = parseFloat(sessionStorage.getItem("musique_temps") || "0");

	var demarrer = function () {
		if (derniereCategorie === categorie && !isNaN(dernierTemps) && dernierTemps > 0) {
			try {
				audio.currentTime = dernierTemps;
			} catch (e) {
				// ignore
			}
		}
		var promesse = audio.play();
		if (promesse && promesse.catch) {
			promesse.catch(function () {
				// Le navigateur bloque la lecture automatique : on démarre au premier clic/touche
				var demarrerAuClic = function () {
					audio.play();
					document.removeEventListener("click", demarrerAuClic);
					document.removeEventListener("keydown", demarrerAuClic);
				};
				document.addEventListener("click", demarrerAuClic);
				document.addEventListener("keydown", demarrerAuClic);
			});
		}
	};
	demarrer();

	window.addEventListener("beforeunload", function () {
		sessionStorage.setItem("musique_categorie", categorie);
		sessionStorage.setItem("musique_temps", audio.currentTime);
	});

	// Petit bouton pour couper/remettre le son, affiché sur toutes les pages
	var bouton = document.createElement("button");
	bouton.id = "bouton-musique";
	bouton.type = "button";
	bouton.textContent = coupe ? "🔇" : "🔊";
	bouton.title = "Couper/remettre la musique";
	bouton.addEventListener("click", function () {
		audio.muted = !audio.muted;
		sessionStorage.setItem("musique_coupee", audio.muted ? "1" : "0");
		bouton.textContent = audio.muted ? "🔇" : "🔊";
	});
	document.body.appendChild(bouton);
})();
