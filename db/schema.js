const {
  gql
} = require('apollo-server');

//Schema
const typeDefs = gql `

type User {
  id: ID
  name: String
  lastName: String
  email: String
  createdAt: String
}

type Token {
  token: String
}

type Result {
  message: String
}

input UserInput {
  name: String!
  lastName: String!
  email: String!
  password: String!
}

input AuthInput {
  email: String!
  password: String!
}

type Product {
  id: ID,
  name: String,
  stock: Int,
  price: Float,
  createdAt: String
}

type Client {
  id: ID
  name: String
  lastName: String
  business: String
  email: String
  telephone: String
  seller: ID
}

type Order {
  id: ID
  order: [OrderGroup]
  total: Float
  seller: ID
  client: ID
  date: String
  status: OrderStatus
}

type OrderGroup {
  id: ID
  quantity: Int
}

type TopClient {
  client: [Client]
  total: Float
}

type TopSeller {
  seller: [User]
  total: Float
}

input ProductInput {
  name: String!
  stock: Int!
  price: Float!
}

input ClientInput {
  name: String
  lastName: String
  business: String
  email: String
  telephone: String
}

input OrderInput {
  order: [OrderProductInput]
  total: Float!
  client: ID!
  status: OrderStatus

}

enum OrderStatus {
  PENDING,
  COMPLETE
  CANCELED
}

input OrderProductInput {
  id: ID
  quantity: Int
}

  type Query {
    #Usuarios
    getUser: User
    getUserList: [User]

    #Products
    getProductList: [Product]
    getProductById(id: ID!): Product

    #Clients
    getClientById(id: ID!): Client
    getClientList: [Client]
    getClientListBySeller: [Client]

    #Orders
    getOrderList: [Order]
    getOrderListBySeller: [Order]
    getOrderListById(id: ID!): Order
    getOrderListByStatus(status: String!): [Order]

    #Avanced searchs
    bestClients: [TopClient]
    getBestSellers: [TopSeller]
    searchProducts(q: String!): [Product]
  } 

  type Mutation {
    #Users
    createUser(input: UserInput): User
    authUser(input: AuthInput): Token

    #Products
    createProduct(input: ProductInput): Product
    updateProduct(id: ID!, input: ProductInput): Product
    deleteProduct(id: ID!): String

    #Clients
    createClient(input: ClientInput): Client
    updateClient(id: ID!, input: ClientInput): Client
    deleteClient(id: ID!): String

    #orders
    createOrder(input: OrderInput): Order
    updateOrder(id: ID!, input: OrderInput): Order
    deleteOrder(id: ID!): String
  }
`;

module.exports = typeDefs;
