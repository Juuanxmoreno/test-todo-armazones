import { Router } from 'express';
import { ProductController } from '@controllers/product.controller';
import { upload } from '@config/multer';
import { checkAdmin } from '@middlewares/authMiddleware';

const router: Router = Router();
const productController: ProductController = new ProductController();

router.post('/', checkAdmin, upload.any(), productController.createProductWithVariants);
router.get('/', productController.getProducts);
router.get('/search', productController.searchProducts);

router.get('/:slug', productController.getProductVariantsByProductSlug);
router.patch('/:productId', checkAdmin, upload.any(), productController.updateProductWithVariants);

export default router;
