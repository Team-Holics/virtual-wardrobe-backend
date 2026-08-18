const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `
      SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.profile_image,
        u.account_status,
        p.profile_id,
        p.gender,
        p.height,
        p.weight,
        p.skin_tone,
        p.body_type,
        p.style_preferences,
        p.avatar_image
      FROM "User" u
      LEFT JOIN Profile p
        ON u.user_id = p.user_id
      WHERE u.user_id = $1
      `,
            [req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Profile error:", error);

        res.status(500).json({
            error: "Failed to fetch profile",
        });
    }
});

router.put("/", authenticateToken, async (req, res) => {
    try {
        const {
            gender,
            height,
            weight,
            skin_tone,
            body_type,
            style_preferences,
            avatar_image,
        } = req.body;

        const userId = req.user.user_id;

        const result = await pool.query(
            `
      INSERT INTO Profile
      (
        user_id,
        gender,
        height,
        weight,
        skin_tone,
        body_type,
        style_preferences,
        avatar_image,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)

      ON CONFLICT (user_id)
      DO UPDATE SET
        gender = EXCLUDED.gender,
        height = EXCLUDED.height,
        weight = EXCLUDED.weight,
        skin_tone = EXCLUDED.skin_tone,
        body_type = EXCLUDED.body_type,
        style_preferences = EXCLUDED.style_preferences,
        avatar_image = EXCLUDED.avatar_image,
        updated_at = CURRENT_TIMESTAMP

      RETURNING *
      `,
            [
                userId,
                gender,
                height,
                weight,
                skin_tone,
                body_type,
                style_preferences,
                avatar_image,
            ]
        );

        res.json({
            message: "Profile updated successfully",
            profile: result.rows[0],
        });
    } catch (error) {
        console.error("Profile update error:", error);

        res.status(500).json({
            error: "Failed to update profile",
        });
    }
});

module.exports = router;