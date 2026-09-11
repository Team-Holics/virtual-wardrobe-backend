const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// GET ALL SAVED OUTFITS FOR CURRENT USER
// =====================================================

router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
            SELECT
                saved_outfit_id,
                user_id,
                recommendation_id,
                outfit_name,
                image_key,
                created_at
            FROM Saved_Outfit
            WHERE user_id = $1
            ORDER BY saved_outfit_id DESC
            `,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching saved outfits:", error);

        res.status(500).json({
            error: "Failed to fetch saved outfits",
        });
    }
});

// =====================================================
// SAVE OUTFIT
// =====================================================

router.post("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const {
            recommendation_id,
            outfit_name,
            image_key,
        } = req.body;

        if (!recommendation_id || !recommendation_id.trim()) {
            return res.status(400).json({
                error: "Recommendation ID is required",
            });
        }

        if (!outfit_name || !outfit_name.trim()) {
            return res.status(400).json({
                error: "Outfit name is required",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO Saved_Outfit
            (
                user_id,
                recommendation_id,
                outfit_name,
                image_key
            )
            VALUES ($1, $2, $3, $4)

            ON CONFLICT (user_id, recommendation_id)
            DO UPDATE SET
                outfit_name = EXCLUDED.outfit_name,
                image_key = EXCLUDED.image_key

            RETURNING *
            `,
            [
                userId,
                recommendation_id.trim(),
                outfit_name.trim(),
                image_key?.trim() || null,
            ]
        );

        res.status(201).json({
            message: "Outfit saved successfully",
            saved_outfit: result.rows[0],
        });
    } catch (error) {
        console.error("Error saving outfit:", error);

        res.status(500).json({
            error: "Failed to save outfit",
        });
    }
});

// =====================================================
// DELETE SAVED OUTFIT BY RECOMMENDATION ID
// =====================================================

router.delete(
    "/:recommendationId",
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.user_id;
            const recommendationId =
                req.params.recommendationId;

            const result = await pool.query(
                `
                DELETE FROM Saved_Outfit
                WHERE user_id = $1
                  AND recommendation_id = $2
                RETURNING *
                `,
                [userId, recommendationId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: "Saved outfit not found",
                });
            }

            res.json({
                message: "Saved outfit removed successfully",
                saved_outfit: result.rows[0],
            });
        } catch (error) {
            console.error(
                "Error deleting saved outfit:",
                error
            );

            res.status(500).json({
                error: "Failed to remove saved outfit",
            });
        }
    }
);

module.exports = router;