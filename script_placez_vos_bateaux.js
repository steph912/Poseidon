const containers = document.querySelectorAll('.container');
const bateaux = document.querySelectorAll('.bateau');

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
        }
    });
});
