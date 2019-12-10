const http = require('http');
const { ApolloServer } = require('apollo-server-express');
const express = require('express');

const config = require('./config')
const schema = require("./api")

const app = express();
const server = new ApolloServer({
    schema,
    playground: config.debug,
    cors: config.cors,
    context: ({ req, connection }) => {
      if (!! connection ) return {...connection.context, pubsub}
      if (!!req) {
          const token = req.headers['authorization'];
          if (!!token) {
              try {
                  let verifiedData = jwt.verify(token, process.env.JWT_SECRET);
                  return { authenticatedId: verifiedData.user, authenticatedType: verifiedData.type, pubsub }
              } catch (err) {
                  return {}
              }
          }
      }
  },
  subscriptions: {
      onConnect: async (connectionParams) => {
          let verifiedData = jwt.verify(connectionParams.authorization, process.env.JWT_SECRET);
          return { authenticatedId: verifiedData.user, authenticatedType: verifiedData.type }
      }
  }
});

app.get('/', function (req, res) {
    res.send('Hola :) !')
})

server.applyMiddleware({app})

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen(config.port, () => {
  console.log(`🚀 Server ready at http://localhost:${config.port}${server.graphqlPath}`)
  console.log(`🚀 Subscriptions ready at ws://localhost:${config.port}${server.subscriptionsPath}`)
})