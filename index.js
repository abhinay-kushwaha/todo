import express from "express";
import mongoose from "mongoose";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { engine } from "express-handlebars";
import handlebars from "handlebars";
import { readFileSync } from "fs";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from a .env file

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/todoDB";
console.log("db", MONGO_URI);

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// MongoDB Connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define Mongoose Schema and Model
const todoSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  completed: { type: Boolean, default: false },
});

const Todo = mongoose.model("Todo", todoSchema);

app.engine(
  "handlebars",
  engine({
    runtimeOptions: {
      allowProtoPropertiesByDefault: true, // Allow accessing prototype properties
      allowProtoMethodsByDefault: true,
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", [`${__dirname}/views`]);

app.use(express.urlencoded({ extended: false }));
app.use(express.static(`${__dirname}/public`));

handlebars.registerHelper("ifEqual", function (a, b, opts) {
  return a === b ? opts.fn(this) : opts.inverse(this);
});

const todoInput = handlebars.compile(
  readFileSync(`${__dirname}/views/partials/todo-input.handlebars`, "utf-8")
);
const todoItem = handlebars.compile(
  readFileSync(`${__dirname}/views/partials/todo-item.handlebars`, "utf-8")
);
const filterBtns = handlebars.compile(
  readFileSync(`${__dirname}/views/partials/filter-buttons.handlebars`, "utf-8")
);
const noTodo = handlebars.compile(
  readFileSync(`${__dirname}/views/partials/no-todo.handlebars`, "utf-8")
);

const FILTER_MAP = {
  All: () => true,
  Active: (todo) => !todo.completed,
  Completed: (todo) => todo.completed,
};

const FILTER_NAMES = Object.keys(FILTER_MAP);

app.get("/", async (req, res) => {
  const selectedFilter = req.query.filter ?? "All";
  const todos = await Todo.find().lean(); // 👈 Convert Mongoose documents to plain objects
  const filteredTodos = todos.filter(FILTER_MAP[selectedFilter]);

  res.render("index", {
    partials: { todoInput, todoItem, filterBtns, noTodo },
    todos: filteredTodos,
    filters: FILTER_NAMES.map((filterName) => ({
      filterName,
      count: todos.filter(FILTER_MAP[filterName]).length,
    })),
    selectedFilter,
    noTodos: filteredTodos.length,
  });
});

app.post("/todos", async (req, res) => {
  const { todo, selectedFilter = "All" } = req.body;

  try {
    const existingTodo = await Todo.findOne({
      name: todo.trim().toLowerCase(),
    });

    if (existingTodo) {
      return res
        .status(400)
        .send("This todo already exists. Please enter a new one.");
    }

    const newTodo = new Todo({ name: todo });
    await newTodo.save();

    const todos = await Todo.find();
    const filteredTodos = todos.filter(FILTER_MAP[selectedFilter]);

    setTimeout(() => {
      res.render("index", {
        layouts: false,
        partials: { todoInput, todoItem, filterBtns, noTodo },
        todos: filteredTodos,
        filters: FILTER_NAMES.map((filterName) => ({
          filterName,
          count: todos.filter(FILTER_MAP[filterName]).length,
        })),
        selectedFilter,
        noTodos: filteredTodos.length,
      });
    }, 2000);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.patch("/todo/:_id", async (req, res) => {
  const { _id } = req.params;
  const selectedFilter = req.query.filter ?? "All";
  const { completed } = req.body;

  try {
    const todo = await Todo.findById(_id);
    if (!todo) return res.status(404).send("Todo not found");

    todo.completed = !!completed;
    await todo.save();

    const todos = await Todo.find();
    const filteredTodos = todos.filter(FILTER_MAP[selectedFilter]);

    res.render("index", {
      layouts: false,
      partials: { todoInput, todoItem, filterBtns, noTodo },
      todos: filteredTodos,
      filters: FILTER_NAMES.map((filterName) => ({
        filterName,
        count: todos.filter(FILTER_MAP[filterName]).length,
      })),
      selectedFilter,
      noTodos: filteredTodos.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.delete("/todos/:_id", async (req, res) => {
  const { _id } = req.params;
  const selectedFilter = req.query.filter ?? "All";

  try {
    await Todo.findByIdAndDelete(_id);
    const todos = await Todo.find();

    res.render("partials/filter-buttons", {
      layout: false,
      partials: { noTodo },
      filters: FILTER_NAMES.map((filterName) => ({
        filterName,
        count: todos.filter(FILTER_MAP[filterName]).length,
      })),
      selectedFilter,
      noTodos: todos.filter(FILTER_MAP[selectedFilter]).length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/todos/:_id/edit", async (req, res) => {
  const { _id } = req.params;
  const selectedFilter = req.query.filter ?? "All";

  try {
    const todo = await Todo.findById(_id).lean(); // 👈 Convert to plain object
    if (!todo) return res.status(404).send("Todo not found");

    res.render("partials/todo-item-edit", {
      layout: false,
      ...todo,
      selectedFilter,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/todos/:_id", async (req, res) => {
  const { _id } = req.params;
  const selectedFilter = req.query.filter ?? "All";

  try {
    const todo = await Todo.findById(_id).lean(); // 👈 Convert to plain object
    if (!todo) return res.status(404).send("Todo not found");

    res.render("partials/todo-item", {
      layout: false,
      ...todo,
      selectedFilter,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.put("/todos/:_id", async (req, res) => {
  const { _id } = req.params;
  const { name } = req.body;

  try {
    const todo = await Todo.findById(_id);
    if (!todo) return res.status(404).send("Todo not found");

    todo.name = name;
    await todo.save();

    res.render("partials/todo-item", {
      layout: false,
      ...todo.toObject(), // 👈 Convert to plain object
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
