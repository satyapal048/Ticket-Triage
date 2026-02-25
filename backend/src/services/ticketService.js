const db = require('../db/database');
const { analyzeTicket } = require('../analyzer/ticketAnalyzer');

class TicketService {
    /**
     * Analyzes and saves a new ticket message.
     * @param {string} message 
     * @returns {Object} the complete ticket record (with ID and timestamp)
     */
    static async processNewTicket(message) {
        // Run analyzer logic
        const analysis = analyzeTicket(message);

        // Prepare to insert into database
        const insertStmt = db.prepare(`
            INSERT INTO tickets (message, category, priority, urgency, confidence, keywords, signals)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        // Execute insert
        const info = await insertStmt.run(
            analysis.message,
            analysis.category,
            analysis.priority,
            analysis.urgency ? 1 : 0,
            analysis.confidence,
            JSON.stringify(analysis.keywords),
            JSON.stringify(analysis.signals)
        );

        // Return unified object as required
        return {
            id: info.lastInsertRowid,
            message: analysis.message,
            category: analysis.category,
            priority: analysis.priority,
            urgency: analysis.urgency,
            confidence: analysis.confidence,
            keywords: analysis.keywords,
            signals: analysis.signals,
            // we could read it back, but we can just use new Date() for the response to save a query
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Gets the latest tickets.
     * @param {number} limit 
     * @returns {Array} List of tickets
     */
    static async getRecentTickets(limit = 50) {
        const stmt = db.prepare(`
            SELECT * FROM tickets 
            ORDER BY id DESC 
            LIMIT ?
        `);

        const rows = await stmt.all(limit);

        // Map db formats back to original structures
        return rows.map(row => ({
            id: row.id,
            message: row.message,
            category: row.category,
            priority: row.priority,
            urgency: row.urgency === 1,
            confidence: row.confidence,
            keywords: JSON.parse(row.keywords || '[]'),
            signals: JSON.parse(row.signals || '[]'),
            createdAt: row.created_at
        }));
    }
}

module.exports = TicketService;
