const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const {
            prompt,
            occasion,
            weather,
            recommended_outfit,
            score,
        } = req.body;

        if (!prompt) {
            return res.status(400).json({
                error: "Prompt is required",
            });
        }

        const result = await pool.query(
            `
      INSERT INTO AI_Recommendation
      (
        user_id,
        prompt,
        occasion,
        weather,
        recommended_outfit,
        score
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
            [
                userId,
                prompt,
                occasion || null,
                weather || null,
                recommended_outfit || null,
                score ?? null,
            ]
        );

        res.status(201).json({
            message: "Recommendation saved successfully",
            recommendation: result.rows[0],
        });
    } catch (error) {
        console.error("Recommendation error:", error);

        res.status(500).json({
            error: "Failed to save recommendation",
        });
    }
});

router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
      SELECT
        recommendation_id,
        user_id,
        prompt,
        occasion,
        weather,
        recommended_outfit,
        score,
        created_at
      FROM AI_Recommendation
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching recommendations:", error);

        res.status(500).json({
            error: "Failed to fetch recommendations",
        });
    }
});

module.exports = router;