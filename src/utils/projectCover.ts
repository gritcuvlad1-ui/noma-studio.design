import { Project } from '../data/projects';

/**
 * Poza „de cover" a fiecărui proiect — aceeași imagine folosită pe cardul din
 * pagina Portofoliu și în sliderul din homepage, ca să fie consistente.
 *
 * Cheile sunt INDEXUL proiectului în lista `projects` (0-based).
 */

// Index card → poziție în project.allImages
const COVER_BY_INDEX: Record<number, number> = {
  1: 3,  // Proiect 2 → poza 4 din allImages
  2: 22, // Proiect 3 → poza 23
  3: 21, // Proiect 4 → IMG_6026 (după ștergerea unei poze)
  5: 26, // Proiect 6 → poza 27
  6: 15, // Proiect 7 → poza 16
};

// Carduri care folosesc prima poză din project.images
const FIRST_IMAGE_ONLY = new Set<number>([0, 4]);

export function getProjectCoverImage(project: Project, index: number): string {
  // Proiectele din admin au coperta setată explicit → are prioritate.
  if (project.coverImage) {
    return project.coverImage;
  }
  if (FIRST_IMAGE_ONLY.has(index)) {
    return project.images[0];
  }
  const coverIdx = COVER_BY_INDEX[index];
  if (coverIdx !== undefined && project.allImages && project.allImages[coverIdx]) {
    return project.allImages[coverIdx];
  }
  return project.images[0];
}
