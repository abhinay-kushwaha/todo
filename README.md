# Todo List App

## Overview

This is a simple **Todo List App** built with HTMX, Express, and Handlebars. **HTMX** is used to enable dynamic interactions with minimal JavaScript, providing a smooth user experience. It features a minimalistic design powered by **Tailwind CSS** and utilizes **LowDB** as the database for lightweight data storage. The app allows users to add, edit, and delete tasks in an intuitive interface.

---

## Features

- Add new todos
- Edit existing todos
- Mark todos as completed
- Delete todos
- Dynamic styling with Tailwind CSS
- Real-time updates with HTMX

---

## Prerequisites

Before running the application, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (v8 or higher)

---

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd todo-list-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Usage

### Run the Development Server

To start the server in development mode with live reloading:

```bash
npm start
```

### Build and Watch Tailwind CSS

To compile Tailwind CSS and watch for changes:

```bash
npm run watch
```

### Build Tailwind CSS (One-Time Build)

To build the CSS without watching for changes:

```bash
npm run build:css
```

---

## Project Structure

```
.
├── index.js                # Main application entry point
├── index.css               # Tailwind CSS input file
├── public/
│   ├── css/
│   │   └── style.css       # Compiled Tailwind CSS output
│   └── assets/             # Static assets (e.g., icons, images)
├── views/                  # Handlebars templates
│   ├── layouts/            # Layout templates
│   ├── partials/           # Partial templates
│   └── *.handlebars        # Individual view files
├── db.json                 # LowDB database file
└── package.json            # Project configuration and dependencies
```

---

## Dependencies

### Production Dependencies

- **express**: Web framework for Node.js
- **express-handlebars**: Template engine integration for Express
- **handlebars**: Logic-less templating engine
- **lowdb**: Lightweight JSON database for storing todos
- **uuid**: Library for generating unique IDs
- **htmx**: Enables dynamic interactions with minimal JavaScript

### Development Dependencies

- **nodemon**: Automatically restarts the server on code changes
- **tailwindcss**: Utility-first CSS framework for styling

---

## Learn More

- **HTMX**:https://htmx.org/docs/
