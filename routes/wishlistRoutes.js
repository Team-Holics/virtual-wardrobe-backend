const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { outfit_id } = req.body;

        if (!outfit_id) {
            return res.status(400).json({
                error: "Outfit ID is required",
            });
        }

        const outfitCheck = await pool.query(
            `
      SELECT outfit_id
      FROM Outfit
      WHERE outfit_id = $1
      `,
            [outfit_id]
        );

        if (outfitCheck.rows.length === 0) {
            return res.status(404).json({
                error: "Outfit not found",
            });
        }

        const existingWishlist = await pool.query(
            `
      SELECT wishlist_id
      FROM Wishlist
      WHERE user_id = $1
        AND outfit_id = $2
      `,
            [userId, outfit_id]
        );

        if (existingWishlist.rows.length > 0) {
            return res.status(409).json({
                error: "Outfit is already in wishlist",
            });
        }

        const result = await pool.query(
            `
      INSERT INTO Wishlist
      (user_id, outfit_id)
      VALUES ($1, $2)
      RETURNING *
      `,
            [userId, outfit_id]
        );

        res.status(201).json({
            message: "Outfit added to wishlist successfully",
            wishlist: result.rows[0],
        });
    } catch (error) {
        console.error("Wishlist error:", error);

        res.status(500).json({
            error: "Failed to add outfit to wishlist",
        });
    }
});

router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
      SELECT
        w.wishlist_id,
        w.saved_at,
        o.outfit_id,
        o.outfit_name,
        o.occasion,
        o.style,
        o.ai_score,
        o.created_at
      FROM Wishlist w

      JOIN Outfit o
        ON w.outfit_id = o.outfit_id

      WHERE w.user_id = $1

      ORDER BY w.saved_at DESC
      `,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching wishlist:", error);

        res.status(500).json({
            error: "Failed to fetch wishlist",
        });
    }
});

router.delete("/:outfitId", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const outfitId = req.params.outfitId;

        const result = await pool.query(
            `
      DELETE FROM Wishlist
      WHERE user_id = $1
        AND outfit_id = $2
      RETURNING wishlist_id, outfit_id
      `,
            [userId, outfitId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Wishlist item not found",
            });
        }

        res.json({
            message: "Outfit removed from wishlist successfully",
            wishlist: result.rows[0],
        });
    } catch (error) {
        console.error("Error removing wishlist item:", error);

        res.status(500).json({
            error: "Failed to remove outfit from wishlist",
        });
    }
});

module.exports = router;