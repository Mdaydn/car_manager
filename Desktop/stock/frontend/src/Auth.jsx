import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // ✅ ADD THIS

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate(); // ✅ ADD THIS

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // SIGNIN
        const res = await API.post("/signin", {
          email: form.email,
          password: form.password,
        });

        alert(res.data.message);

        localStorage.setItem("token", res.data.token);

        navigate("/dashboard"); // ✅ GO TO DASHBOARD AFTER LOGIN
      } else {
        // SIGNUP
        const res = await API.post("/signup", form);

        alert(res.data.message);

        setIsLogin(true); // optional: switch to login after signup
        navigate("/login"); // or you can send to /dashboard if you want auto login
      }

      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div style={styles.container}>
      <h2>{isLogin ? "Signin" : "Signup"}</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        {!isLogin && (
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            style={styles.input}
          />
        )}

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={styles.input}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          style={styles.input}
        />

        <button style={styles.button}>
          {isLogin ? "Login" : "Signup"}
        </button>
      </form>

      <p style={{ marginTop: 10 }}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <span
          onClick={() => setIsLogin(!isLogin)}
          style={{ color: "blue", cursor: "pointer" }}
        >
          {isLogin ? "Signup" : "Signin"}
        </span>
      </p>
    </div>
  );
}

const styles = {
  container: {
    width: 320,
    margin: "80px auto",
    textAlign: "center",
    border: "1px solid #ddd",
    padding: 20,
    borderRadius: 10,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  input: {
    padding: 10,
    borderRadius: 5,
    border: "1px solid #ccc",
  },
  button: {
    padding: 10,
    background: "black",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};

export default Auth;