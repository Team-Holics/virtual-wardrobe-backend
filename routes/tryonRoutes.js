const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const {
            outfit_id,
            uploaded_image,
            avatar_image,
            result_image,
            fit_confidence,
            size_prediction,
        } = req.body;

        if (outfit_id) {
            const outfitCheck = await pool.query(
                `
        SELECT outfit_id
        FROM Outfit
        WHERE outfit_id = $1
          AND user_id = $2
        `,
                [outfit_id, userId]
            );

            if (outfitCheck.rows.length === 0) {
                return res.status(404).json({
                    error: "Outfit not found",
                });
            }
        }

        const result = await pool.query(
            `
      INSERT INTO TryOn_Session
      (
        user_id,
        outfit_id,
        uploaded_image,
        avatar_image,
        result_image,
        fit_confidence,
        size_prediction
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
            [
                userId,
                outfit_id || null,
                uploaded_image || null,
                avatar_image || null,
                result_image || null,
                fit_confidence ?? null,
                size_prediction || null,
            ]
        );

        res.status(201).json({
            message: "Try-on session created successfully",
            session: result.rows[0],
        });
    } catch (error) {
        console.error("Error creating try-on session:", error);

        res.status(500).json({
            error: "Failed to create try-on session",
        });
    }
});

router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
      SELECT
        t.session_id,
        t.user_id,
        t.outfit_id,
        t.uploaded_image,
        t.avatar_image,
        t.result_image,
        t.fit_confidence,
        t.size_prediction,
        t.created_at,
        o.outfit_name,
        o.occasion,
        o.style
      FROM TryOn_Session t

      LEFT JOIN Outfit o
        ON t.outfit_id = o.outfit_id

      WHERE t.user_id = $1

      ORDER BY t.created_at DESC
      `,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching try-on sessions:", error);

        res.status(500).json({
            error: "Failed to fetch try-on sessions",
        });
    }
});

module.exports = router;