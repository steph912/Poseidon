const draggables = document.querySelectorAll('.draggable');
const containers = document.querySelectorAll('.container');

// Ajoute un événement pour gérer le drag des éléments
draggables.forEach(draggable => {
  draggable.addEventListener('dragstart', () => {
    draggable.classList.add('dragging');
  });

  draggable.addEventListener('dragend', () => {
    draggable.classList.remove('dragging');
  });
});

// Gère le dragover dans chaque conteneur
containers.forEach(container => {
  container.addEventListener('dragover', e => {
    e.preventDefault(); // Autorise le dragover

    const afterElement = getDragAfterElement(container, e.clientY);
    const draggable = document.querySelector('.dragging');

    // Vérifie si l'emplacement est occupé
    if (!afterElement && container.children.length > 0) {
      // Si aucune place libre à la fin, empêche le drop
      return;
    }

    if (afterElement == null) {
      // Si l'emplacement est libre à la fin, dépose l'élément
      container.appendChild(draggable);
    } else {
      // Vérifie si l'élément n'est pas déjà là
      if (afterElement.classList.contains('occupied')) {
        return; // Empêche le drop
      }
      container.insertBefore(draggable, afterElement);
    }

    // Marque l'élément déposé comme "occupant"
    draggable.classList.add('occupied');
  });
});

// Fonction pour obtenir l'élément juste après la position actuelle
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.draggable:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
