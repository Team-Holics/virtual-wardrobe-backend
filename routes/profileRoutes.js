const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

/*
========================================================
GET PROFILE
GET /api/profile
========================================================
*/
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
                p.height,
                p.weight,
                p.chest,
                p.waist,
                p.hip,
                p.shoulder_width,
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
        console.error("Profile fetch error:", error);

        res.status(500).json({
            error: "Failed to fetch profile",
        });
    }
});


/*
========================================================
UPDATE PROFILE
PUT /api/profile
========================================================
*/
router.put("/", authenticateToken, async (req, res) => {
    try {
        const {
            height,
            weight,
            chest,
            waist,
            hip,
            shoulder_width,
            style_preferences,
            avatar_image,
        } = req.body;

        const userId = req.user.user_id;

        const result = await pool.query(
            `
            INSERT INTO Profile
            (
                user_id,
                height,
                weight,
                chest,
                waist,
                hip,
                shoulder_width,
                style_preferences,
                avatar_image,
                updated_at
            )

            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                CURRENT_TIMESTAMP
            )

            ON CONFLICT (user_id)

            DO UPDATE SET
                height = EXCLUDED.height,
                weight = EXCLUDED.weight,
                chest = EXCLUDED.chest,
                waist = EXCLUDED.waist,
                hip = EXCLUDED.hip,
                shoulder_width = EXCLUDED.shoulder_width,
                style_preferences = EXCLUDED.style_preferences,
                avatar_image = EXCLUDED.avatar_image,
                updated_at = CURRENT_TIMESTAMP

            RETURNING *
            `,
            [
                userId,
                height || null,
                weight || null,
                chest || null,
                waist || null,
                hip || null,
                shoulder_width || null,
                style_preferences || null,
                avatar_image || null,
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