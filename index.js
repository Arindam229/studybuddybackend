require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Database initialization
const { CosmosClient } = require("@azure/cosmos");

let database, container;

async function initDb() {
    try {
        if (!process.env.COSMOS_CONNECTION_STRING) {
            console.warn("⚠️  COSMOS_CONNECTION_STRING is missing. Bypassing database initialization.");
            return;
        }

        console.log("Connecting to Azure Cosmos DB...");
        const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);

        // Connect to database and container
        const databaseId = "studybuddy-db";
        const containerId = "users";

        const { database: db } = await client.databases.createIfNotExists({ id: databaseId });
        database = db;

        const { container: cont } = await database.containers.createIfNotExists({
            id: containerId,
            partitionKey: { paths: ["/studentId"] }
        });
        container = cont;

        console.log("✅ Successfully connected to Cosmos DB container:", container.id);
    } catch (error) {
        console.error("❌ Failed to connect to Cosmos DB:", error.message);
    }
}

// Start Server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    await initDb();
});

// Export for Vercel
module.exports = app;
module.exports.getContainer = () => container;
