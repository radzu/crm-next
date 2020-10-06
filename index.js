const { ApolloServer } = require("apollo-server");
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
const mongooseConnect = require('./config/db');
const jwt = require('jsonwebtoken');

//Conectar a la db
mongooseConnect();

//Servidor
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({req}) => {
    // console.log(req.headers['authorization']);
    let token = req.headers['authorization'] || '';
    token = token.replace('Bearer ', '');
    if (token) {
      try {
        const user = jwt.verify(token, process.env.KEYWORD_SECRED);
      return {
          user
        }
      } catch (error) {
        console.log('Ocurrió un error');
        console.log('error :>> ', error);
      }
    }
  }
});

// arrancar el servidor
server.listen().then(({ url }) => {
  console.log(`Servidor listo en la URL: ${url}`);
});