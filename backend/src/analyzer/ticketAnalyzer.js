const config = require('../config/keywords');

/**
 * Normalizes the input message mapping it to lowercase and removing extra spaces.
 * @param {string} message 
 * @returns {string}
 */
function normalize(message) {
    return (message || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Classifies a ticket message into a category based on keyword matches.
 * @param {string} normalizedMessage 
 * @returns {{category: string, matchedKeywords: string[], score: number}}
 */
function classify(normalizedMessage) {
    let bestCategory = "Other";
    let maxMatches = 0;
    let finalMatchedKeywords = [];

    // Order defines tie-breaker precedence
    const categoryOrder = ["Technical", "Billing", "Account", "Feature Request", "Other"];

    for (const category of categoryOrder) {
        if (category === "Other") continue;

        const keywords = config.categories[category];
        let matches = 0;
        let matchedKeywords = [];

        for (const kw of keywords) {
            // Check for keyword presence (simple substring match for robustness)
            if (normalizedMessage.includes(kw)) {
                matches++;
                matchedKeywords.push(kw);
            }
        }

        if (matches > maxMatches) {
            maxMatches = matches;
            bestCategory = category;
            finalMatchedKeywords = matchedKeywords;
        }
    }

    return {
        category: bestCategory,
        matchedKeywords: finalMatchedKeywords,
        score: maxMatches
    };
}

/**
 * Detects if the message contains urgency terms.
 * @param {string} normalizedMessage 
 * @returns {boolean}
 */
function detectUrgency(normalizedMessage) {
    return config.urgencyTerms.some(term => normalizedMessage.includes(term));
}

/**
 * Detects if the message contains security-related terms.
 * @param {string} normalizedMessage 
 * @returns {boolean}
 */
function detectSecurity(normalizedMessage) {
    return config.securityTerms.some(term => normalizedMessage.includes(term));
}

/**
 * Assigns a priority (P0-P3) to the ticket.
 * @param {string} normalizedMessage 
 * @param {string} category 
 * @param {boolean} isUrgent 
 * @param {boolean} isSecurity 
 * @returns {string}
 */
function assignPriority(normalizedMessage, category, isUrgent, isSecurity) {
    // 1. CUSTOM RULE FIRST: if isSecurity → always P0, override everything
    if (isSecurity) return "P0";

    // 2. Check P0 signal keywords in message
    const hasP0Keyword = config.prioritySignals.P0.some(kw => normalizedMessage.includes(kw));
    if (hasP0Keyword) return "P0";

    // 3. Check P1 signal keywords OR isUrgent
    const hasP1Keyword = config.prioritySignals.P1.some(kw => normalizedMessage.includes(kw));
    if (hasP1Keyword || isUrgent) return "P1";

    // Special rule: Feature Request caps at P2 max
    // Note: If a feature request had P0/P1 keywords, it would have been caught above.
    // However, the rule states "Feature Request category caps at P2 max".
    // If it *is* a feature request and reached here, it can only be P2 or P3.

    // 4. Check P2 signal keywords
    const hasP2Keyword = config.prioritySignals.P2.some(kw => normalizedMessage.includes(kw));
    if (hasP2Keyword) return "P2";

    // If it's a feature request but has no specific P2 signals, it falls back to P3.
    if (category === "Feature Request") {
        // Since we caught P0/P1 above, let's explicitly enforce the cap just in case
        // the requirements meant *always* cap regardless of keywords.
        // But the requirements say "CUSTOM RULE FIRST", so security overrides.
        // If it got here without P0/P1, it's P2 or P3 anyway.
    }

    // Default
    return "P3";
}

/**
 * Calculates a confidence score (0.0 to 1.0) for the analysis.
 * @param {string[]} matchedKeywords 
 * @param {string} message 
 * @param {boolean} isUrgent 
 * @param {boolean} isSecurity 
 * @returns {number}
 */
function calculateConfidence(matchedKeywords, message, isUrgent, isSecurity) {
    // Base: matchedKeywords.length / 5 (capped at 1.0)
    let score = matchedKeywords.length / 5;

    // Boost +0.1 if urgency detected
    if (isUrgent) score += 0.1;

    // Boost +0.1 if security detected
    if (isSecurity) score += 0.1;

    // Cap at 1.0
    score = Math.min(score, 1.0);

    // Round to 2 decimal places
    return Math.round(score * 100) / 100;
}

/**
 * Builds an array of structured signal objects explaining the analysis.
 * @param {string} category 
 * @param {string[]} matchedKeywords 
 * @param {boolean} isUrgent 
 * @param {boolean} isSecurity 
 * @returns {Array<{type: string, message: string}>}
 */
function buildSignals(category, matchedKeywords, isUrgent, isSecurity) {
    const signals = [];

    if (isSecurity) {
        signals.push({ type: "ESCALATION", message: "⚠️ Security escalation: immediate review required" });
    }

    if (category !== "Other") {
        signals.push({ type: "INFO", message: `Matched ${matchedKeywords.length} keywords for category ${category}` });
    } else {
        signals.push({ type: "INFO", message: "No specific category keywords found, defaulted to Other" });
    }

    if (isUrgent && !isSecurity) {
        signals.push({ type: "WARNING", message: "Urgency detected based on user terminology" });
    }

    return signals;
}

/**
 * Main entry point to analyze a ticket message.
 * @param {string} message 
 * @returns {Object} The analysis result
 */
function analyzeTicket(message) {
    if (typeof message !== 'string' || !message.trim()) {
        throw new Error('Message must be a non-empty string');
    }
    if (message.length > 2000) {
        throw new Error('Message must be 2000 characters or less');
    }

    const normalized = normalize(message);

    // 2. Classify
    let { category, matchedKeywords, score } = classify(normalized);

    // 3. Detect urgency
    const isUrgent = detectUrgency(normalized);

    // 4. Detect security (CUSTOM RULE)
    const isSecurity = detectSecurity(normalized);

    // Apply Security Escalation overriding rule
    if (isSecurity && category !== "Technical") {
        // Only override to Technical if it's not already more specific. 
        // Based on the prompt: "Auto-assign category: "Technical" (if not already more specific)"
        // If it was Account, we'll keep Account? Or switch to Technical?
        // Let's force "Technical" as it's the most common security bucket, unless it's already "Technical" or "Account".
        if (category === "Other" || category === "Feature Request" || category === "Billing") {
            category = "Technical";
        }
    }

    // Special cap rule for Feature Request
    if (category === "Feature Request" && !isSecurity) {
        // If it's a feature request, cap priority at P2 unless it's a security issue
        const tempPriority = assignPriority(normalized, category, isUrgent, false);
        var finalPriority = (tempPriority === "P0" || tempPriority === "P1") ? "P2" : tempPriority;
    } else {
        var finalPriority = assignPriority(normalized, category, isUrgent, isSecurity);
    }

    // 6. Calculate confidence
    const confidence = calculateConfidence(matchedKeywords, category);

    // 7. Build signals
    const signals = buildSignals(category, matchedKeywords, isUrgent, isSecurity);

    // Collect all matched keywords (from category, urgency, priority, security contexts if we wanted to visually show them)
    // The prompt just asks for `matchedKeywords` from classify, plus maybe urgency ones? 
    // We will stick to `matchedKeywords` from classify to keep it simple, but we can augment it if we detect security/urgency terms.
    let allKeywords = new Set(matchedKeywords);
    config.urgencyTerms.forEach(term => { if (normalized.includes(term)) allKeywords.add(term); });
    config.securityTerms.forEach(term => { if (normalized.includes(term)) allKeywords.add(term); });

    return {
        message: message,
        category: category,
        priority: finalPriority,
        urgency: isUrgent,
        confidence: confidence,
        keywords: Array.from(allKeywords),
        signals: signals
    };
}

module.exports = {
    normalize,
    classify,
    detectUrgency,
    detectSecurity,
    assignPriority,
    calculateConfidence,
    buildSignals,
    analyzeTicket
};
