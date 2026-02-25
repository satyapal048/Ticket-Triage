const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticketController');

// Define routes
router.post('/analyze', TicketController.analyze);
router.get('/', TicketController.getRecent);

module.exports = router;
