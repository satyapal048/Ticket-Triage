module.exports = {
  categories: {
    Billing: [
      "invoice", "charge", "payment", "refund", "billing", "subscription",
      "price", "fee", "overcharged", "receipt", "transaction"
    ],
    Technical: [
      "error", "bug", "crash", "not working", "broken", "down", "issue",
      "fail", "500", "timeout", "login", "install", "slow", "freeze"
    ],
    Account: [
      "account", "password", "username", "login", "locked", "access",
      "profile", "email", "reset", "2fa", "signup", "verify"
    ],
    "Feature Request": [
      "feature", "suggest", "add", "would be nice", "request",
      "improvement", "enhance", "wish", "could you", "please add"
    ],
    Other: [] // fallback
  },
  urgencyTerms: [
    "urgent", "asap", "immediately", "critical", "emergency",
    "right now", "as soon as possible", "down", "outage", "broken now"
  ],
  prioritySignals: {
    P0: ["outage", "down", "emergency", "critical", "data loss", "security breach"],
    P1: ["urgent", "asap", "not working", "broken", "crash", "immediately"],
    P2: ["slow", "error", "bug", "issue", "fail", "timeout"],
    P3: ["feature", "suggest", "improvement", "question", "how to"]
  },
  // CUSTOM RULE — Security Escalation
  securityTerms: [
    "hack", "hacked", "breach", "unauthorized", "phishing",
    "stolen", "compromised", "security", "fraud", "suspicious login"
  ]
};
