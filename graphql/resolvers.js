const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { GraphQLUpload } = require("graphql-upload-minimal");
const xlsx = require("xlsx");
const Category = require("../models/Category");

const SECRET_KEY = "abcabc";

module.exports = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await User.findById(user.id);
    },
    getCategory: async (_, { id }) => {
      return await Category.findById(id).populate("parent");
    },
    getCategories: async () => {
      const categories = await Category.find().lean();
      const map = {};
      categories.forEach((cat) => (map[cat._id] = { ...cat, children: [] }));
      categories.forEach((cat) => {
        if (cat.parent) map[cat.parent]?.children.push(map[cat._id]);
      });
      return Object.values(map).filter((cat) => !cat.parent);
    },
  },
  Mutation: {
    register: async (_, { name, email, password }) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) throw new Error("User already exists");
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashedPassword });
      const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1d" });
      return { token, user };
    },
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error("Invalid credentials");
      }
      const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1d" });
      return { token, user };
    },
    forgotPassword: async (_, { email }) => {
      const user = await User.findOne({ email });
      if (!user) return "If the email exists, instructions will be sent";
      // Placeholder logic for email send
      console.log("Reset link for:", email);
      return "If the email exists, instructions will be sent";
    },
    createCategory: async (_, { name, parent }, { user }) => {
      if (!user) throw new Error("Unauthorized");
      return await Category.create({ name, parent });
    },
    updateCategory: async (_, { id, name, parent }, { user }) => {
      if (!user) throw new Error("Unauthorized");
      const update = {};
      if (name !== undefined) update.name = name;
      if (parent !== undefined) update.parent = parent;
      return await Category.findByIdAndUpdate(id, update, { new: true });
    },
    deleteCategory: async (_, { id }, { user }) => {
      if (!user) throw new Error("Unauthorized");
      await Category.deleteMany({ parent: id });
      await Category.findByIdAndDelete(id);
      return "Category deleted";
    },
    importCategories: async (_, { file }, { user }) => {
      if (!user) throw new Error("Unauthorized");

      const { createReadStream } = await file;
      const stream = createReadStream();

      const buffer = await new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
      });

      const workbook = xlsx.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet);

      for (const row of data) {
        if (row.name) {
          await Category.create({ name: row.name, parent: null });
        }
      }

      return "Categories imported successfully";
    },
  },
  Category: {
    parent: async (category) =>
      category.parent ? await Category.findById(category.parent) : null,
    children: async (category) => await Category.find({ parent: category._id }),
  },
  Upload: GraphQLUpload,
};
