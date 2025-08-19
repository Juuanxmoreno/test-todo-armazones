import { Router } from 'express';
import { CatalogController } from '@controllers/catalog.controller';
import { upload } from '@config/multer';
import { checkSession } from '@middlewares/authMiddleware';
import { validateRequest } from '@middlewares/validate-request';
import { GenerateCatalogRequestSchema } from '../schemas/catalog.schema';

const router = Router();
const catalogController = new CatalogController();

/**
 * POST /catalog/generate
 * Genera un catálogo en PDF
 * - Requiere autenticación de administrador
 * - Acepta un archivo de logo opcional
 * - Body: GenerateCatalogRequestDto
 */
router.post(
  '/generate',
  checkSession,
  upload.single('logo'), // Campo opcional para el logo
  validateRequest(GenerateCatalogRequestSchema),
  catalogController.generateCatalog,
);

export default router;
