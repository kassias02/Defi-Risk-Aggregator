const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://defiadmin:Latifa06@deficluster.a0qih.mongodb.net/defi-analyzer?retryWrites=true&w=majority&appName=DefiCluster";

async function testConnection() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    await client.close();
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

testConnection();