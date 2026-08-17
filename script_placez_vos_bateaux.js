const containers = document.querySelectorAll('.container');
const bateaux = document.querySelectorAll('.bateau');
let lastPlacedBateauId = null; // Stocke l'id du dernier bateau placé

// placedBateaux garde en mémoire, pour chaque bateau posé, les cases occupées.
// Cet objet sert à sauvegarder le placement quand on clique sur "J'ai terminé".
// Format : { idDuBateau: { positions: [12, 13, 14], size: 3, orientation: 'horizontal' } }
let placedBateaux = {};

// Nombre total de cases que doivent occuper tous les bateaux (2+3+3+4+5)
const TOTAL_CASES_BATEAUX = Array.from(bateaux).reduce(
    (total, bateau) => total + bateau.children.length,
    0
);

// Ajout des événements pour chaque bateau
bateaux.forEach(bateau => {
    bateau.addEventListener('dragstart', () => {
        bateau.classList.add('dragging'); // Ajoute une classe pour identifier l'élément en train d'être glissé
    });

    bateau.addEventListener('dragend', () => {
        bateau.classList.remove('dragging'); // Retire la classe après le drag
    });
});

// Gestion du drag-and-drop sur les conteneurs
containers.forEach((container, index) => {
    container.addEventListener('dragover', e => {
        e.preventDefault(); // Autorise le drop
    });

    container.addEventListener('drop', e => {
        e.preventDefault();

        // Récupère le bateau en cours de drag
        const draggingBateau = document.querySelector('.dragging');

        if (draggingBateau) {
            const bateauId = draggingBateau.id;
            const navires = Array.from(draggingBateau.children); // Récupère les divs `.navire`
            const navireLength = navires.length;
            const currentRow = Math.floor(index / 10); // Détermine la ligne actuelle (0 à 9)
            const rowStartIndex = currentRow * 10; // Index de début de la ligne
            const rowEndIndex = rowStartIndex + 10; // Index de fin de la ligne
            // Vérifie s'il y a assez de place dans la ligne actuelle
            let freeContainers = 0;
            for (let i = index; i < rowEndIndex; i++) {
                if (containers[i].classList.contains('occupied')) {
                    alert('Pas assez de place dans cette ligne pour déposer le bateau !');
                    return;
                }
                if (!containers[i].classList.contains('occupied')) {
                    freeContainers++;
                }
                if (freeContainers >= navireLength) break; // Stop si suffisamment de place
            }

            if (freeContainers < navireLength) {
                alert('Pas assez de place dans cette ligne pour déposer le bateau !');
                return;
            }

            // Place les navires dans les conteneurs libres de la ligne actuelle
            let currentContainerIndex = index;
            const placedPositions = []; // Cases occupées par ce bateau

            navires.forEach(navire => {
                while (
                    currentContainerIndex < rowEndIndex &&
                    containers[currentContainerIndex].classList.contains('occupied')
                ) {
                    currentContainerIndex++;
                }

                if (currentContainerIndex < rowEndIndex) {
                    const container = containers[currentContainerIndex];

                    // Copie le style du navire dans le conteneur
                    container.style.backgroundColor = getComputedStyle(navire).backgroundColor;
                    container.style.border = getComputedStyle(navire).border;
                    container.style.borderRadius = getComputedStyle(navire).borderRadius;
                    container.style.width = getComputedStyle(navire).width;
                    container.style.height = getComputedStyle(navire).height;

                    container.classList.add('occupied'); // Marque la cellule comme occupée

                    placedPositions.push(currentContainerIndex); // On mémorise la case pour la sauvegarde

                    currentContainerIndex++;
                }
            });

            // Sauvegarde du placement de ce bateau (utilisé pour la sauvegarde finale et la rotation)
            placedBateaux[bateauId] = {
                positions: placedPositions,
                size: navireLength,
                orientation: 'horizontal',
            };

            // Met à jour le dernier bateau placé
            lastPlacedBateauId = bateauId;

            // Supprime les navires du bateau pour éviter les doublons
            draggingBateau.remove();

        }
    });
});

// Bouton de rotation
document.querySelector('.rotate_button').addEventListener('click', () => {
    if (lastPlacedBateauId && placedBateaux[lastPlacedBateauId]) {
        const bateauInfo = placedBateaux[lastPlacedBateauId];
        const { size, orientation } = bateauInfo;
        const startIndex = bateauInfo.positions[0];

        if (orientation === 'horizontal') {
            // Vérifie si la rotation vers vertical est possible
            let canRotate = startIndex + (size - 1) * 10 <= 99; // Vérifie si les cellules verticales existent
            let canRotate2 = true;

            for (let i = 0; i < size; i++) {
                const cell = containers[startIndex + i + 10];
                if (!cell || (cell.classList.contains('occupied') && !bateauInfo.positions.includes(startIndex + i + 10))) {
                    canRotate2 = false;
                    alert('Impossible de tourner le bateau car il y a un obstacle en dessous.');
                    break;
                }

            }

            if (canRotate && canRotate2 === true) {
                // Supprime les styles des cellules actuelles
                for (let i = 0; i < size; i++) {
                    const cell = containers[startIndex + i];
                    cell.classList.remove('occupied');
                    cell.classList.remove('bateau_' + size + '_cases');
                    cell.style.backgroundColor = '';
                }

                // Applique les nouveaux styles en mode vertical
                const newPositions = [];
                for (let i = 0; i < size; i++) {
                    const cell = containers[startIndex + i * 10];
                    cell.classList.add('occupied');
                    cell.classList.add('bateau_' + size + '_cases');
                    newPositions.push(startIndex + i * 10);
                }
                // Met à jour l'orientation et les cases occupées
                bateauInfo.orientation = 'vertical';
                bateauInfo.positions = newPositions;
            }
        } else if (orientation === 'vertical') {
            // Vérifie si la rotation vers horizontal est possible
            const canRotate = startIndex % 10 + size <= 10; // Vérifie si les cellules horizontales existent
            if (canRotate) {
                // Supprime les styles des cellules actuelles
                for (let i = 0; i < size; i++) {
                    const cell = containers[startIndex + i * 10];
                    cell.classList.remove('occupied');
                    cell.classList.remove('bateau_' + size + '_cases');
                    cell.style.backgroundColor = '';

                }
                // Applique les nouveaux styles en mode horizontal
                const newPositions = [];
                for (let i = 0; i < size; i++) {
                    const cell = containers[startIndex + i];
                    cell.classList.add('occupied');
                    cell.classList.add('bateau_' + size + '_cases');
                    newPositions.push(startIndex + i);
                }
                // Met à jour l'orientation et les cases occupées
                bateauInfo.orientation = 'horizontal';
                bateauInfo.positions = newPositions;
            } else {
                alert('Pas assez de place pour effectuer la rotation.');
            }
        }
    } else {
        alert('Aucun bateau n’a été déposé.');
    }
});

// Ajouter un événement au bouton "Réinitialiser"
document.querySelector('.reset_button').addEventListener('click', () => {
    location.reload(); // Recharge la page
});

// Sauvegarde du placement des bateaux quand on clique sur "J'ai terminé"
const formTermine = document.querySelector('.retour');
if (formTermine) {
    formTermine.addEventListener('submit', e => {
        const casesPlacees = Object.values(placedBateaux).reduce(
            (total, bateau) => total + bateau.positions.length,
            0
        );

        // On vérifie que tous les bateaux ont bien été placés avant de valider
        if (Object.keys(placedBateaux).length < bateaux.length || casesPlacees < TOTAL_CASES_BATEAUX) {
            e.preventDefault();
            alert('Veuillez placer tous vos bateaux sur la grille avant de continuer.');
            return;
        }

        // On sérialise le placement de chaque bateau (liste des cases occupées) dans le champ caché
        const placementInput = document.getElementById('placement_input');
        if (placementInput) {
            const bateauxPositions = Object.values(placedBateaux).map(bateau => bateau.positions);
            placementInput.value = JSON.stringify(bateauxPositions);
        }
    });
}
