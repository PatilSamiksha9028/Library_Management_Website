# Athena Library Management System 📚

A modern, full-stack Library Management System web application built with **Node.js, Express, and Vanilla JavaScript/CSS**.

---

## ✨ Features

- **📊 Comprehensive Dashboard**: Real-time statistics tracking total books, available shelf stock, active borrowings, and registered members.
- **📖 Book Catalog Management**:
  - Add, edit, and delete books.
  - Search by Title, Author, or ISBN.
  - Filter by category with live updates.
  - Automatic stock validation and copy tracking.
- **🔄 Circulation & Loan Management**:
  - Issue books to members with customizable loan duration.
  - One-click book return flow with automatic stock replenishment.
  - Status badges for active loans, returned books, and overdue alerts.
- **👥 Member Directory**:
  - Register new members with membership plans (Student, Faculty, General, VIP).
  - Track contact info and member borrowing status.
  - Deletion safeguards preventing removal of members with outstanding borrowed books.
- **💎 Glassmorphic Dark UI**: Modern responsive design with smooth animations, toasts, and modal workflows.

---

## 🚀 Running the Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
The server will start on: **`http://localhost:5000`**

---

## 📂 Project Structure

```text
├── data/
│   └── database.json      # File-based JSON storage
├── public/
│   ├── index.html         # Main dashboard and view layouts
│   ├── style.css          # Glassmorphic dark theme stylesheet
│   └── app.js             # Client state management and REST API client
├── server.js              # Express REST API backend and static server
├── package.json           # Node configuration and dependencies
└── README.md              # Project documentation
```
