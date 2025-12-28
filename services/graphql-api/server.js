const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { createServer } = require('http');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');

const app = express();
const pubsub = new PubSub();

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3002', 'http://api-gateway:3000', 'http://frontend-app:3002'], credentials: true }));
app.use(express.json());

// DATA STORE
let healthLogs = [{ id: '1', category: 'VITAL', metric: 'Blood Pressure', value: '120/80', unit: 'mmHg', notes: 'Normal', createdAt: new Date().toISOString() }];

// --- PERBAIKAN ADA DI SINI (Menambahkan NUTRITION dan MOOD) ---
const typeDefs = `
  enum LogCategory { VITAL SYMPTOM ACTIVITY NUTRITION MOOD }
  type HealthLog { id: ID! category: LogCategory! metric: String! value: String! unit: String notes: String createdAt: String! }
  type Query { logs: [HealthLog!]! log(id: ID!): HealthLog }
  type Mutation { createLog(category: LogCategory!, metric: String!, value: String!, unit: String, notes: String): HealthLog! }
  type Subscription { logAdded: HealthLog! }
`;

const resolvers = {
  Query: { logs: () => healthLogs, log: (_, { id }) => healthLogs.find(l => l.id === id) },
  Mutation: {
    createLog: (_, args) => {
      const newLog = { id: uuidv4(), ...args, unit: args.unit || '', notes: args.notes || '', createdAt: new Date().toISOString() };
      healthLogs.push(newLog);
      pubsub.publish('LOG_ADDED', { logAdded: newLog });
      return newLog;
    },
  },
  Subscription: { logAdded: { subscribe: () => pubsub.asyncIterator(['LOG_ADDED']) } },
};

async function startServer() {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const httpServer = createServer(app);
  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
  const serverCleanup = useServer({ schema }, wsServer);
  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({ userId: req.headers['x-user-id'] }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), { async serverWillStart() { return { async drainServer() { await serverCleanup.dispose(); } }; } }],
  });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => console.log(`🚀 VitalTrack GraphQL running on port ${PORT}`));
}
app.get('/health', (req, res) => res.json({ status: 'healthy' }));
startServer();