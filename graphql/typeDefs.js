const { gql } = require('apollo-server-express');

module.exports = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Category {
    id: ID!
    name: String!
    parent: Category
    children: [Category]
  }

  type Query {
    me: User
    getCategory(id: ID!): Category
    getCategories: [Category]
  }

  scalar Upload
  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
    forgotPassword(email: String!): String

    createCategory(name: String!, parent: ID): Category
    updateCategory(id: ID!, name: String, parent: ID): Category
    deleteCategory(id: ID!): String
    importCategories(file: Upload!): String
  }
`;
