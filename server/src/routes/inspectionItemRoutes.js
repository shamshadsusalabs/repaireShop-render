const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
    getAllItems,
    createItem,
    updateItem,
    deleteItem,
} = require('../controllers/inspectionItemController');

const router = express.Router();

router
    .route('/')
    .get(protect, getAllItems)
    .post(protect, authorize('admin', 'manager'), createItem);

router
    .route('/:id')
    .put(protect, authorize('admin', 'manager'), updateItem)
    .delete(protect, authorize('admin', 'manager'), deleteItem);

module.exports = router;
