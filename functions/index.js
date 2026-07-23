const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

// Award daily login points endpoint
exports.awardLoginPoints = onRequest((request, response) => {
  logger.info("Daily login point requested", { structuredData: true });
  response.send({ success: true, pointsAwarded: 20 });
});
