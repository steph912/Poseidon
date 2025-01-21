const containers = document.querySelectorAll('.container');
const bateaux = document.querySelectorAll('.bateau');
let lastPlacedBateau = null; // Stocke le dernier bateau placé

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
            const navires = Array.from(draggingBateau.children); // Récupère les divs `.navire`
            const navireLength = navires.length;
            const currentRow = Math.floor(index / 10); // Détermine la ligne actuelle (0 à 9)
            const rowStartIndex = currentRow * 10; // Index de début de la ligne
            const rowEndIndex = rowStartIndex + 10; // Index de fin de la ligne

            // Vérifie s'il y a assez de place dans la ligne actuelle
            let freeContainers = 0;
            for (let i = index; i < rowEndIndex; i++) {
                if (!containers[i].classList.contains('occupied')) {
                    freeContainers++;
                }
                if (freeContainers >= navireLength) break; // Stop si suffisamment de place
            }

            if (freeContainers < navireLength) {
                alert("Pas assez de place dans cette ligne pour déposer tous les navires !");
                return;
            }

            // Place les navires dans les conteneurs libres de la ligne actuelle
            let currentContainerIndex = index;
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
                    currentContainerIndex++;
                }
            });

            // Supprime les navires du bateau pour éviter les doublons
            draggingBateau.remove();

            // Met à jour le dernier bateau placé
            lastPlacedBateau = {
                element: draggingBateau,
                startIndex: index,
                size: navireLength,
                orientation: 'horizontal',
            };
        } 
    });
});

// Bouton de rotation
document.querySelector('.rotate_button').addEventListener('click', () => {
    if (lastPlacedBateau) {
        const { size, startIndex, orientation} = lastPlacedBateau;

        if (orientation === 'horizontal') {
            // Vérifie si la rotation vers vertical est possible
            const canRotate = startIndex + (size - 1) * 10 <= 99; // Vérifie si les cellules verticales existent
            if (canRotate) {
                // Supprime les styles des cellules actuelles
                for (let i = 0; i < size; i++) {
                    const cell = containers[startIndex + i];
                    cell.classList.remove('occupied');
                    cell.style.backgroundColor = '';
                }
                // Applique les nouveaux styles en mode vertical
                for (let i = 0; i < size; i++) {
                    const cell = containers[startIndex + i * 10];
                    cell.classList.add('occupied');
                    cell.classList.add(`bateau_${size}_cases`); // Couleur de votre bateau
                }

                // Met à jour l'orientation
                lastPlacedBateau.orientation = 'vertical';
            } else {
                alert('Pas assez de place pour effectuer la rotation.');
            }
        } else if (orientation === 'vertical') {
            // Vérifie si la rotation vers horizontal est possible
            const rowStart = Math.floor(startIndex / 10) * 10;
            const rowEnd = rowStart + 10;
            const canRotate = startIndex % 10 + size <= 10; // Vérifie si les cellules horizontales existent
            if (canRotate) {
                // Supprime les styles des cellules actuelles
                for (let i = 0; i < size; i++) {
                    const cell = containers[startIndex + i * 10];
                    cell.classList.remove('occupied');
                    cell.style.backgroundColor = '';
                }

                // Applique les nouveaux styles en mode horizontal
                for (let i = 0; i < size; i++) {
                    const cell = containers[startIndex + i];
                    cell.classList.add('occupied');
                }

                // Met à jour l'orientation
                lastPlacedBateau.orientation = 'horizontal';
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