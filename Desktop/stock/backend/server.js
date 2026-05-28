const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "stock_secret_key";



const app = express();


app.use(cors());
app.use(express.json());

/* =========================
   DATABASE
========================= */
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "stock",
});

db.connect((err) => {
  if (err) console.log(err);
  else console.log("MySQL Connected...");
});


 //  SIGN UP

app.post("/api/signup", (req, res) => {
  const { name, email, password } = req.body;

  const checkUser = "SELECT * FROM users WHERE email = ?";

  db.query(checkUser, [email], async (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertUser =
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(insertUser, [name, email, hashedPassword], (err) => {
      if (err) return res.status(500).json(err);

      res.json({ message: "User registered successfully" });
    });
  });
});

/* =========================
   SIGN IN
========================= */
app.post("/api/signin", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  });
});




app.post("/api/spareparts",  (req, res) => {
  const { name, category, unitPrice } = req.body;

  const sql =
    "INSERT INTO spare_part (name, category, unitPrice) VALUES (?, ?, ?)";

  db.query(sql, [name, category, unitPrice], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Spare part added" });
  });
});

app.get("/api/spareparts", (req, res) => {
  db.query("SELECT * FROM spare_part", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

/* =========================
   STOCK IN
========================= */
app.post("/api/stockin",  (req, res) => {
  const { spare_part_id, quantity, unitPrice } = req.body;

  const check = "SELECT * FROM stock_in WHERE spare_part_id = ?";

  db.query(check, [spare_part_id], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length > 0) {
      const update = `
        UPDATE stock_in
        SET quantity = quantity + ?, unitPrice = ?
        WHERE spare_part_id = ?
      `;

      db.query(update, [quantity, unitPrice, spare_part_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Stock updated" });
      });
    } else {
      const insert =
        "INSERT INTO stock_in (spare_part_id, quantity, unitPrice, totalPrice) VALUES (?, ?, ?, ?)";

      db.query(
        insert,
        [spare_part_id, quantity, unitPrice, quantity * unitPrice],
        (err) => {
          if (err) return res.status(500).json(err);
          res.json({ message: "Stock added" });
        }
      );
    }
  });
});

/* =========================
   STOCK OUT
========================= */
app.post("/api/stockout", (req, res) => {
  const { spare_part_id, quantity, unitPrice } = req.body;

  // STEP 1: get total stock IN
  const stockInQuery = `
    SELECT IFNULL(SUM(quantity), 0) AS total_in
    FROM stock_in
    WHERE spare_part_id = ?
  `;

  // STEP 2: get total stock OUT
  const stockOutQuery = `
    SELECT IFNULL(SUM(quantity), 0) AS total_out
    FROM stock_out
    WHERE spare_part_id = ?
  `;

  db.query(stockInQuery, [spare_part_id], (err, inResult) => {
    if (err) return res.status(500).json(err);

    db.query(stockOutQuery, [spare_part_id], (err, outResult) => {
      if (err) return res.status(500).json(err);

      const totalIn = inResult[0].total_in;
      const totalOut = outResult[0].total_out;

      const availableStock = totalIn - totalOut;

      // 🚨 BLOCK IF NOT ENOUGH STOCK
      if (quantity > availableStock) {
        return res.status(400).json({
          message: "❌ Not enough stock available",
          available: availableStock,
        });
      }

      // STEP 3: insert stock out
      const insert = `
        INSERT INTO stock_out 
        (spare_part_id, quantity, unitPrice, totalPrice)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        insert,
        [spare_part_id, quantity, unitPrice, quantity * unitPrice],
        (err) => {
          if (err) return res.status(500).json(err);

          res.json({
            message: "✅ Stock removed successfully",
            remaining: availableStock - quantity,
          });
        }
      );
    });
  });
});

/* =========================
   STOCK REPORT (IN + OUT + REMAINING)
========================= */
app.get("/api/report", (req, res) => {
  const sql = `
    SELECT 
      sp.id,
      sp.name,
      sp.category,

      IFNULL(SUM(si.quantity), 0) AS total_stock_in,
      IFNULL(SUM(so.quantity), 0) AS total_stock_out,

      (IFNULL(SUM(si.quantity), 0) - IFNULL(SUM(so.quantity), 0)) 
      AS remaining_stock

    FROM spare_part sp

    LEFT JOIN stock_in si 
      ON sp.id = si.spare_part_id

    LEFT JOIN stock_out so 
      ON sp.id = so.spare_part_id

    GROUP BY sp.id, sp.name, sp.category;
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err,
      });
    }

    res.json(result);
  });
});
/* =========================
   START SERVER
========================= */
app.listen(5000, () => {
  console.log("Server running on port 5000");
});