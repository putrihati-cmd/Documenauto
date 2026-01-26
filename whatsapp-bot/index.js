require('dotenv').config();
const axios = require('axios');
const API_URL = process.env.API_URL || 'http://backend:3001';

console.log('SmartCopy Bot Client Starting...');
console.log(`Connecting to Backend: ${API_URL}`);

// Simulate a keep-alive or checking loop
// In a real WAHA scenario, this service might not be needed if WAHA pushes directly to Backend.
// However, if we use this as a "Poller" or "Job Runner", we keep it alive.

// For now, let's just make it a simple process that stays alive
setInterval(() => {
    console.log('Bot Agent Heartbeat...');
}, 60000);

// TODO: If we move the "Router" logic here, we need to set up a server to receive webhooks
// OR simpler: WAHA -> Backend (Router) -> Redis -> Bot Agent (Action)
// The "Router" logic is best placed in the Backend API to handle the HTTP webhook.
// This "Bot Agent" will be responsible for sending messages OUT or handling files if needed.
