const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
    getAllModels,
    createModel,
    updateModel,
    deleteModel,
} = require('../controllers/carModelController');

const router = express.Router();

router
    .route('/')
    .get(protect, getAllModels)
    .post(protect, authorize('admin', 'manager'), createModel);

router
    .route('/:id')
    .put(protect, authorize('admin', 'manager'), updateModel)
    .delete(protect, authorize('admin', 'manager'), deleteModel);

module.exports = router;
