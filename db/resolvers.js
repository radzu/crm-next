const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const Client = require('../models/client');
const bcryptjs = require('bcryptjs');
require('dotenv').config({
  path: 'environment.env'
});
const jwt = require('jsonwebtoken');
const client = require('../models/client');

const createToken = (user, secret, expiresIn) => {
  console.log('user :>> ', user);
  const {
    id,
    email,
    name,
    lastName
  } = user;
  return jwt.sign({
    id,
    email,
    name,
    lastName
  }, secret, {
    expiresIn
  });
}

// Resolvers
const resolvers = {
  Query: {
    //User
    getUser: async (_, {}, ctx) => {
      return ctx.user;
    },
    getUserList: async () => {
      try {
        const userList = await User.find({});
        return userList;
      } catch (error) {
        console.log('error :>> ', error);
      }
    },
    //Products
    getProductList: async () => {
      try {
        const productList = await Product.find({});
        return productList;
      } catch (error) {
        console.log('error :>> ', error);
      }
    },
    getProductById: async (_, {
      id
    }) => {
      try {
        const product = await Product.findById(id);
        if (!product) {
          throw new Error('Producto not found');
        }
        console.log('product :>> ', product);
        return product
      } catch (error) {
        console.log('error :>> ', error);
      }
    },
    // Clients
    getClientById: async (_, {
      id
    }, ctx) => {
      const client = await Client.findById(id);
      if (!client) {
        throw new Error('Client not found with id: ' + id);
      }
      if (client.seller.toString() !== ctx.user.id) {
        throw new Error('Error ocurred: Inauthorazed');
      }
      return client;
    },
    getClientList: async () => {
      try {
        const clientList = await Client.find({});
        return clientList;
      } catch (error) {
        console.log('error :>> ', error);
      }
    },
    getClientListBySeller: async (_, {}, ctx) => {
      try {
        const clientList = await Client.find({
          seller: ctx.user.id.toString()
        });
        return clientList;
      } catch (error) {
        console.log('error :>> ', error);
      }
    },
    // Orders
    getOrderList: async (_, {}, ctx) => {
      try {
        const orderList = await Order.find({});
        return orderList;
      } catch (error) {
        console.log('error :>> ', error);
      }
    },
    getOrderListBySeller: async (_, {}, ctx) => {
      try {
        const orderList = await Order.find({
          seller: ctx.user.id
        });
        return orderList;
      } catch (error) {
        console.log('error :>> ', error);
      }
    },
    getOrderListById: async (_, {
      id
    }, ctx) => {
      let order = null;
      try {
        order = await Order.findById(id);
      } catch (error) {
        console.log('Order not found');
      }

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.seller.toString() !== ctx.user.id) {
        throw new Error('Authorization error');
      }

      return order;
    },
    getOrderListByStatus: async (_, {
      status
    }, ctx) => {
      const orders = await Order.find({
        seller: ctx.user.id,
        status
      });
      return orders;
    },
    bestClients: async () => {
      const clients = await Order.aggregate([{
          $match: {
            status: 'PENDING'
          }
        },
        {
          $group: {
            _id: '$client',
            total: {
              $sum: '$total'
            }
          }
        },
        {
          $lookup: {
            from: 'client',
            localField: '_id',
            foreignField: '_id',
            as: 'client'
          }
        },
        {
          $sort: {
            total: -1
          }
        }
      ]);
      return clients;
    },
    getBestSellers: async () => {
      const sellers = await Order.aggregate([{
          $match: {
            status: 'PENDING'
          }
        },
        {
          $group: {
            _id: '$seller',
            total: {
              $sum: '$total'
            }
          }
        },
        {
          $lookup: {
            from: 'user',
            localField: '_id',
            foreignField: '_id',
            as: 'seller'
          }
        },
        {
          $limit: 3
        },
        {
          $sort: {
            total: -1
          }
        }
      ]);
      return sellers;
    },
    searchProducts: async (_, {
      q
    }) => {
      const products = await Product.find({
        $text: {
          $search: q
        }
      }).limit(10);
      return products
    }
  },
  Mutation: {
    createUser: async (_, {
      input
    }) => {
      const {
        email,
        password
      } = input;
      // Validar que el usuario no exista
      const existsUser = await User.findOne({
        email
      });
      if (existsUser) {
        throw new Error('El usuario ya está registrado');
      }
      // Hashear el password
      const salt = await bcryptjs.genSalt(12);
      input.password = await bcryptjs.hash(password, salt);

      //Guardar en base de datos
      try {
        const user = new User(input);
        user.save();
        return user;
      } catch (error) {
        console.log('error :>> ', error);
      }
    },

    authUser: async (_, {
      input
    }) => {
      const {
        email,
        password
      } = input;
      // Verificar si el usuario existe
      const existsUser = await User.findOne({
        email
      });
      if (!existsUser) {
        throw new Error('El usuario no existe');
      }
      // Revisar si el password es correcto
      const isEqualPassword = await bcryptjs.compare(password, existsUser.password);
      if (!isEqualPassword) {
        throw new Error('Error de authenticación: La constraseña que ingresó es incorrecto');
      }

      // Crear el token
      return {
        token: createToken(existsUser, process.env.KEYWORD_SECRED, '24h')
      }
    },
    // Products
    createProduct: async (_, {
      input
    }) => {
      try {
        const product = new Product(input);

        // almacenar en la db
        const result = await product.save();
        return result;
      } catch (error) {
        console.log('error :>> ', error);
      }
    },
    updateProduct: async (_, {
      id,
      input
    }) => {
      try {
        let product = await Product.findById(id);
        if (!product) {
          throw new Error('Product not found');
        }
        // Guardar en la base de datos
        product = await Product.findOneAndUpdate({
          _id: id
        }, input, {
          new: true
        });

        return product;
      } catch (error) {
        console.log('error :>> ', error);
      }
    },
    deleteProduct: async (_, {
      id
    }) => {
      let product = await Product.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      await Product.findOneAndDelete({
        _id: id
      });
      return 'Product has been deleted';
    },
    // Clients
    createClient: async (_, {
      input
    }, ctx) => {
      const {
        email
      } = input;
      const client = await Client.findOne({
        email
      });
      if (client) {
        throw new Error('El correo electrónico ha sido registrado en otra cuenta');
      }
      const newClient = new Client(input);
      newClient.seller = ctx.user.id;
      try {
        const result = await newClient.save();
        console.log('result :>> ', result);
        return result;
      } catch (error) {
        console.log('error :>> ', error);
      }
    },
    updateClient: async (_, {
      id,
      input
    }, ctx) => {
      try {
        let client = await Client.findById(id);
        if (!client) {
          throw new Error('Client not found');
        }
        if (client.seller.toString() !== ctx.user.id) {
          throw new Error('Error ocurred: Inauthorazed');
        }
        client = await Client.findOneAndUpdate({
          _id: id
        }, input, {
          new: true
        });
        return client;
      } catch (error) {
        console.log('error :>> ', error);
      }
    },
    deleteClient: async (_, {
      id
    }, ctx) => {
      let client = await Client.findById(id);
      if (!client) {
        throw new Error('Client not found');
      }
      if (client.seller.toString() !== ctx.user.id) {
        throw new Error('Error ocurred: Inauthorazed');
      }
      await Client.findOneAndDelete({
        _id: id
      });
      return 'Client has been deleted';
    },
    // Orders
    createOrder: async (_, {
      input
    }, ctx) => {
      const {
        client
      } = input;
      const _client = await Client.findById(client);

      if (!_client) {
        throw new Error('Client not found');
      }
      if (_client.seller.toString() !== ctx.user.id) {
        throw new Error('Error ocurred: Inauthorazed');
      }

      for await (const product of input.order) {
        const {
          id
        } = product;
        const _product = await Product.findById(id);

        if (product.quantity > _product.stock) {
          throw new Error(`El articulo: ${_product.name} excede la cantidad disponible`);
        } else {
          _product.stock = _product.stock - product.quantity;
          await _product.save();
        }
      };

      const order = new Order(input);
      order.seller = ctx.user.id;

      const result = await order.save();
      return result;
    },
    updateOrder: async (_, {
      id,
      input
    }, ctx) => {
      let order = null;
      const {
        client
      } = input;
      try {
        order = await Order.findById(id);
      } catch (error) {
        console.log('error :>> ', error);
      }

      if (!order) {
        throw new Error('Order not found with id = ' + id);
      }

      let _client = null;

      try {
        _client = await Client.findById(client);
      } catch (error) {
        console.log('error :>> ', error);
      }

      if (!_client) {
        throw new Error('Client not found with id = ' + client);
      }
      if (_client.seller.toString() !== ctx.user.id) {
        throw new Error('Error ocurred: Inauthorazed');
      }

      // Revisar stock
      if (input.order) {
        for await (const product of input.order) {
          const {
            id
          } = product;
          const _product = await Product.findById(id);

          if (product.quantity > _product.stock) {
            throw new Error(`El articulo: ${_product.name} excede la cantidad disponible`);
          } else {
            _product.stock = _product.stock - product.quantity;
            await _product.save();
          }
        };
      }

      try {
        const _order = await Order.findOneAndUpdate({
          _id: id
        }, input, {
          new: true
        });
        return _order;
      } catch (error) {
        console.log('error :>> ', error);
      }

    },
    deleteOrder: async (_, {
      id
    }, ctx) => {
      let order = null;
      try {
        order = await Order.findById(id);
      } catch (error) {
        console.log('error :>> ', error);
      }
      if (!order) {
        throw new Error('Order not found');
      }
      if (order.seller.toString() !== ctx.user.id) {
        throw new Error('Error Inauthoration');
      }
      await Order.findOneAndDelete({
        _id: id
      });
      return 'El producto se elimó correctamente'
    }
  }
}

module.exports = resolvers;
