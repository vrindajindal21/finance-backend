import { Router } from 'express';
import { 
  createRecord, 
  getRecords, 
  updateRecord, 
  deleteRecord, 
  getSummary,
  restoreRecord, 
} from '../controllers/record.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import { 
  financialRecordSchema, 
  updateFinancialRecordSchema, 
  queryRecordSchema 
} from '../validations/record.schema';

const router = Router();

// Everyone authenticated can see the summary (including Viewers)
router.get('/summary', authMiddleware, getSummary);

// Analysts and Admins can view individual records
router.get('/', 
  authMiddleware, 
  roleMiddleware(['ANALYST', 'ADMIN']), 
  validateQuery(queryRecordSchema), 
  getRecords
);

// Only Admins can manage records
router.post('/', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  validateBody(financialRecordSchema), 
  createRecord
);

router.put('/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  validateBody(updateFinancialRecordSchema), 
  updateRecord
);

router.delete('/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  deleteRecord
);

router.post('/:id/restore', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  restoreRecord
);

export default router;
