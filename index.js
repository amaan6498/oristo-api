import dotenv from "dotenv";
dotenv.config();

import express from "express";
import pg from "pg";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";

const port = 5000;
const app = express();
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "sKj9eFv6HrM3#Lq2vP@wTuKz8WxJfTgXzLm4cBzFv1Q!xShD5V2Tb7z*9K7UoYn";

app.use(cors());
app.use(express.json());

const db = new pg.Client({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASS,
  port: process.env.DATABASE_PORT,
});

async function connectToDb() {
  try {
    await db.connect();
    console.log("Connected to Render PostgreSQL 🎉");
  } catch (err) {
    console.error("Error connecting to database:", err);
  }
}

connectToDb();

app.get("/", (req, res) => {
  res.send("Hello Oresto");
});

app.get("/getAllTasks", async (req, res) => {
  const query = "SELECT * FROM todo";

  try {
    const result = await db.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/createTask", (req, res) => {
  const { title, dueDate, status } = req.body;
  const id = uuidv4();
  const date = new Date().toISOString().split("T")[0];
  console.log(id, title, date, dueDate, status);
  const query =
    "INSERT INTO todo (id, title, posteddate, duedate, status) VALUES ($1, $2, $3, $4, $5)";

  db.query(query, [id, title, date, dueDate, status], (err, result) => {
    if (err) {
      console.error("Error executing query", err.stack);
      return res
        .status(500)
        .json({ error: `Error posting data: ${err.message}` });
    }

    res.status(201).json({ message: "Task Added to database" });
  });
});

app.put("/updateTask/:id", (req, res) => {
  const { id } = req.params;
  const { title, duedate, status } = req.body;

  const query = `
    UPDATE todo
    SET title = $1, duedate = $2, status = $3
    WHERE id = $4
  `;

  db.query(query, [title, duedate, status, id], (err, result) => {
    if (err) {
      console.error("Error updating task:", err);
      return res.status(500).json({ error: "Failed to update task" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task updated successfully" });
  });
});

app.delete("/deleteTask/:id", (req, res) => {
  const { id } = req.params;
  console.log(id);
  const query = "DELETE FROM todo WHERE id = $1";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error executing delete query", err.stack);
      return res.status(500).json({ error: "Failed to delete task" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
