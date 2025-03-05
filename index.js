import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { engine } from "express-handlebars";
import handlebars from "handlebars";
import { readFileSync } from "fs";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { v4 as uuid } from "uuid";

const PORT = process.env.PORT || 3000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "db.json");

const app = express();

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", [`${__dirname}/views`]);

app.use(express.urlencoded({ extended: false }));

const adapter = new JSONFile(file);
const defaultData = { todos: [] };

const db = new Low(adapter, defaultData);
await db.read();

handlebars.registerHelper("ifEqual", function (a, b, opts) {
  return a === b ? opts.fn(this) : opts.inverse(this);
});

app.use(express.static(`${__dirname}/public`));

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

app.get("/", (req, res) => {
  const { todos } = db.data;
  const selectedFilter = req.query.filter ?? "All";
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

  // Check if the todo already exists (case-insensitive)
  const existingTodo = db.data.todos.find(
    (item) => item.name.toLowerCase() === todo.trim().toLowerCase()
  );

  if (existingTodo) {
    // Respond with an error message if duplicate is found
    return res
      .status(400)
      .send("This todo already exists. Please enter a new one.");
  }

  // Add new todo if it's not a duplicate
  const newTodo = { id: uuid(), completed: false, name: todo };
  db.data.todos.push(newTodo);
  await db.write();

  const { todos } = db.data;
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
});

app.patch("/todo/:id", async (req, res) => {
  const { id } = req.params;
  const selectedFilter = req.query.filter ?? "All";
  const { completed } = req.body;
  const todo = db.data.todos.find((todo) => todo.id === id);
  if (!todo) {
    return res.status(404).send("Todo not found");
  }
  todo.completed = !!completed;
  await db.write();
  const filteredTodos = db.data.todos.filter(FILTER_MAP[selectedFilter]);
  res.render("index", {
    layouts: false,
    partials: { todoInput, todoItem, filterBtns, noTodo },
    todos: filteredTodos,
    filters: FILTER_NAMES.map((filterName) => ({
      filterName,
      count: db.data.todos.filter(FILTER_MAP[filterName]).length,
    })),
    selectedFilter,
    noTodos: filteredTodos.length,
  });
});

app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const selectedFilter = req.query.filter ?? "All";
  const index = db.data.todos.findIndex((todo) => todo.id === id);
  if (index !== -1) {
    db.data.todos.splice(index, 1);
    await db.write();
  }

  return res.render("partials/filter-buttons", {
    layout: false,
    partials: { noTodo },
    filters: FILTER_NAMES.map((filterName) => ({
      filterName,
      count: db.data.todos.filter(FILTER_MAP[filterName]).length,
    })),
    selectedFilter,
    noTodos: db.data.todos.filter(FILTER_MAP[selectedFilter]).length,
  });
});

app.get("/todos/:id/edit", (req, res) => {
  const { id } = req.params;
  const { selectedFilter } = req.query.filter ?? "All";
  const todo = db.data.todos.find((todo) => todo.id === id);
  if (!todo) {
    return res.status(404).send("Todo not found");
  }

  return res.render(`partials/todo-item-edit`, {
    layout: false,
    ...todo,
    selectedFilter,
  });
});

app.get("/todos/:id", (req, res) => {
  const { id } = req.params;
  const { selectedFilter } = req.query.filter ?? "All";
  const todo = db.data.todos.find((todo) => todo.id === id);
  if (!todo) {
    return res.status(404).send("Todo not found");
  }

  return res.render(`partials/todo-item`, {
    layout: false,
    ...todo,
    selectedFilter,
  });
});

app.put("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const todo = db.data.todos.find((todo) => todo.id === id);
  if (!todo) {
    return res.status(404).send("Todo not found");
  }
  todo.name = name;
  await db.write();
  return res.render(`partials/todo-item`, {
    layout: false,
    ...todo,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
