const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { user_message, ai_response } = req.body;

        if (!user_message || !ai_response) {
            return res.status(400).json({
                error: "User message and AI response are required",
            });
        }

        const result = await pool.query(
            `
      INSERT INTO AI_Conversation
      (
        user_id,
        user_message,
        ai_response
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `,
            [userId, user_message, ai_response]
        );

        res.status(201).json({
            message: "Conversation saved successfully",
            conversation: result.rows[0],
        });
    } catch (error) {
        console.error("Conversation error:", error);

        res.status(500).json({
            error: "Failed to save conversation",
        });
    }
});

router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
      SELECT
        conversation_id,
        user_id,
        user_message,
        ai_response,
        created_at
      FROM AI_Conversation
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching conversations:", error);

        res.status(500).json({
            error: "Failed to fetch conversations",
        });
    }
});

module.exports = router;