import express from "express";
import cors from "cors";
import mysql from "mysql2";

const port = 5000;
const app = express();

app.use(cors());
app.use(express.json());


// DATABASE CONNECTION

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "mng"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed", err);
    } else {
        console.log("Database connected successfully");
    }
});


// CAR ROUTES

app.post("/car", (req, res) => {
    const { type, model, manufacture_year, driverPhone, mechanicName } = req.body;

    const sql = `
        INSERT INTO car(type, model, manufacture_year, driverPhone, mechanicName)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [type, model, manufacture_year, driverPhone, mechanicName], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get("/car", (req, res) => {
    db.query("SELECT * FROM car", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});



// SERVICE ROUTES

app.post("/service", (req, res) => {
    const { serviceName, servicePrice } = req.body;

    const sql = `
        INSERT INTO service(serviceName, servicePrice)
        VALUES (?, ?)
    `;

    db.query(sql, [serviceName, servicePrice], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get("/service", (req, res) => {
    db.query("SELECT * FROM service", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});



// SERVICE RECORD ROUTES

app.post("/serviceRecord", (req, res) => {
    const { serviceCode, carId, serviceDate } = req.body;

    const sql = `
        INSERT INTO service_record(serviceCode, carId, serviceDate)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [serviceCode, carId, serviceDate], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get("/serviceRecord", (req, res) => {
    db.query("SELECT * FROM service_record", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});


// DELETE SERVICE RECORD
app.delete("/serviceRecord/:recordId", (req, res) => {
    const recordId = req.params.recordId;

    const sql = `
        DELETE FROM service_record WHERE recordId = ?
    `;

    db.query(sql, [recordId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});


// UPDATE SERVICE RECORD
app.put("/serviceRecord/:recordId", (req, res) => {
    const recordId = req.params.recordId;
    const { serviceCode, carId, serviceDate } = req.body;

    const sql = `
        UPDATE service_record
        SET serviceCode=?, carId=?, serviceDate=?
        WHERE recordId=?
    `;

    db.query(sql, [serviceCode, carId, serviceDate, recordId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});



// PAYMENT ROUTES

app.post("/payment", (req, res) => {
    const { recordId, amountPaid, paymentDate } = req.body;

    const sql = `
        INSERT INTO payment(recordId, amountPaid, paymentDate)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [recordId, amountPaid, paymentDate], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get("/payment", (req, res) => {
    db.query("SELECT * FROM payment", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

const ADMIN_EMAIL = "muyizerenafsi@gmail.com";

function withRole(user) {
  const email = (user.email || "").toLowerCase();
  const role = email === ADMIN_EMAIL ? "admin" : user.role || "user";
  const { password, ...safe } = user;
  return { ...safe, role };
}

//create account
app.post("/api/auth/signup", (req, res) => {
  const { name, email, password, role } = req.body;
  const userRole =
    (email || "").toLowerCase() === ADMIN_EMAIL
      ? "admin"
      : role === "admin"
        ? "admin"
        : "user";

  db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, password, userRole],
    (err) => {
      if (err) {
        return res.json({ message: "Email already exists" });
      }
      res.json({ message: "User registered successfully" });
    }
  );
});

/* =========================
   SIGNIN
========================= */
app.post("/api/auth/signin", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, result) => {
      if (err) return res.json(err);

      if (result.length === 0) {
        return res.json({ message: "Invalid email or password" });
      }

      res.json({
        message: "Login successful",
        user: withRole(result[0]),
      });
    }
  );
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});