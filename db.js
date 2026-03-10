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

function getContainer() {
    return container;
}

module.exports = { initDb, getContainer };
