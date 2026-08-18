const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.user_id;
        const {
            outfit_name,
            occasion,
            style,
            ai_score,
            item_ids,
        } = req.body;

        if (!outfit_name) {
            return res.status(400).json({
                error: "Outfit name is required",
            });
        }

        if (!Array.isArray(item_ids) || item_ids.length === 0) {
            return res.status(400).json({
                error: "At least one wardrobe item is required",
            });
        }

        await client.query("BEGIN");

        const ownedItems = await client.query(
            `
      SELECT item_id
      FROM Wardrobe_Item
      WHERE user_id = $1
        AND item_id = ANY($2::int[])
      `,
            [userId, item_ids]
        );

        if (ownedItems.rows.length !== item_ids.length) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                error: "One or more wardrobe items are invalid",
            });
        }

        const outfitResult = await client.query(
            `
      INSERT INTO Outfit
      (
        user_id,
        outfit_name,
        occasion,
        style,
        ai_score
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
            [
                userId,
                outfit_name,
                occasion,
                style,
                ai_score,
            ]
        );

        const outfit = outfitResult.rows[0];

        for (const itemId of item_ids) {
            await client.query(
                `
        INSERT INTO Outfit_Item
        (outfit_id, item_id)
        VALUES ($1, $2)
        `,
                [outfit.outfit_id, itemId]
            );
        }

        await client.query("COMMIT");

        res.status(201).json({
            message: "Outfit created successfully",
            outfit,
            item_ids,
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Error creating outfit:", error);

        res.status(500).json({
            error: "Failed to create outfit",
        });
    } finally {
        client.release();
    }
});

router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
      SELECT
        o.outfit_id,
        o.user_id,
        o.outfit_name,
        o.occasion,
        o.style,
        o.ai_score,
        o.created_at,

        COALESCE(
          json_agg(
            json_build_object(
              'item_id', w.item_id,
              'item_name', w.item_name,
              'category', w.category,
              'sub_category', w.sub_category,
              'brand', w.brand,
              'color', w.color,
              'pattern', w.pattern,
              'material', w.material,
              'season', w.season,
              'image_url', w.image_url,
              'favorite', w.favorite
            )
          ) FILTER (WHERE w.item_id IS NOT NULL),
          '[]'
        ) AS items

      FROM Outfit o

      LEFT JOIN Outfit_Item oi
        ON o.outfit_id = oi.outfit_id

      LEFT JOIN Wardrobe_Item w
        ON oi.item_id = w.item_id

      WHERE o.user_id = $1

      GROUP BY o.outfit_id

      ORDER BY o.created_at DESC
      `,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching outfits:", error);

        res.status(500).json({
            error: "Failed to fetch outfits",
        });
    }
});

router.delete("/:id", authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.user_id;
        const outfitId = req.params.id;

        await client.query("BEGIN");

        const outfitCheck = await client.query(
            `
      SELECT outfit_id, outfit_name
      FROM Outfit
      WHERE outfit_id = $1
        AND user_id = $2
      `,
            [outfitId, userId]
        );

        if (outfitCheck.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                error: "Outfit not found",
            });
        }

        await client.query(
            `
      DELETE FROM Outfit_Item
      WHERE outfit_id = $1
      `,
            [outfitId]
        );

        const result = await client.query(
            `
      DELETE FROM Outfit
      WHERE outfit_id = $1
        AND user_id = $2
      RETURNING outfit_id, outfit_name
      `,
            [outfitId, userId]
        );

        await client.query("COMMIT");

        res.json({
            message: "Outfit deleted successfully",
            outfit: result.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Error deleting outfit:", error);

        res.status(500).json({
            error: "Failed to delete outfit",
        });
    } finally {
        client.release();
    }
});

module.exports = router;