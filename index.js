// index.js
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { graphqlUploadExpress } = require('graphql-upload-minimal');

const SECRET_KEY = 'abcabc';

const startServer = async () => {
  const app = express();

  app.use(graphqlUploadExpress());

  app.use((req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
      } catch (err) {
        console.warn("Invalid token");
      }
    }
    next();
  });

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ user: req.user })
  });

  await server.start();
  server.applyMiddleware({ app });

  await mongoose.connect('mongodb+srv://admin:admin123456@cluster0.yhblzau.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  app.listen(4000, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
};

startServer();
