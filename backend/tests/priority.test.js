const { assignPriority, analyzeTicket } = require('../src/analyzer/ticketAnalyzer');

describe('ticketAnalyzer - priority logic', () => {
    test('Security term present → P0', () => {
        const result = analyzeTicket("There is a massive fraud happening");
        expect(result.priority).toBe("P0");
    });

    test('Urgency keyword + no security → P1', () => {
        const result = analyzeTicket("I need an invoice right now");
        expect(result.priority).toBe("P1");
    });

    test('Feature request category → max P2', () => {
        // Contains "urgent" (P1 signal) but is a feature request ("please add")
        const result = analyzeTicket("please add a new button, it's urgent");
        expect(result.category).toBe("Feature Request");
        expect(result.priority).toBe("P2");
    });

    test('No signals → P3', () => {
        const result = analyzeTicket("I have a question about my account");
        expect(result.priority).toBe("P3");
    });

    test('"outage" keyword → P0', () => {
        const result = analyzeTicket("There is a full outage affecting all our users");
        expect(result.priority).toBe("P0");
    });
});
