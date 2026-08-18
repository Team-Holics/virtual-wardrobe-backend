const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                error: "Full name, email and password are required",
            });
        }

        const existingUser = await pool.query(
            'SELECT user_id FROM "User" WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: "Email is already registered",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `
      INSERT INTO "User"
      (full_name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING
        user_id,
        full_name,
        email,
        profile_image,
        account_status,
        created_at,
        updated_at
      `,
            [full_name, email, passwordHash]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            error: "Registration failed",
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }

        const result = await pool.query(
            `
      SELECT
        user_id,
        full_name,
        email,
        password_hash,
        profile_image,
        account_status
      FROM "User"
      WHERE email = $1
      `,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        const user = result.rows[0];

        if (user.account_status !== "Active") {
            return res.status(403).json({
                error: "Account is not active",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                profile_image: user.profile_image,
                account_status: user.account_status,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            error: "Login failed",
        });
    }
});

module.exports = router;