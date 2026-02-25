const TicketService = require('../services/ticketService');

class TicketController {
    /**
     * POST /tickets/analyze
     */
    static async analyze(req, res, next) {
        try {
            const { message } = req.body;

            if (!message || typeof message !== 'string' || message.trim().length < 5) {
                return res.status(400).json({ error: "Message must be at least 5 characters long" });
            }

            if (message.length > 1000) {
                return res.status(400).json({ error: "Message exceeds 1000 characters limit" });
            }

            const result = await TicketService.processNewTicket(message);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /tickets
     */
    static async getRecent(req, res, next) {
        try {
            const tickets = await TicketService.getRecentTickets(50);
            res.status(200).json({ tickets });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = TicketController;
