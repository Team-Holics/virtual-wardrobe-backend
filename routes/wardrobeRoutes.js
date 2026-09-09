const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const supabase = require("../supabaseClient");

const router = express.Router();

/*
========================================================
GET ALL WARDROBE ITEMS FOR LOGGED-IN USER
========================================================
*/
router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
            SELECT
                item_id,
                user_id,
                item_name,
                category,
                sub_category,
                brand,
                color,
                pattern,
                material,
                season,
                image_url,
                source_type,
                shopping_url,
                price,
                favorite,
                date_added,
                updated_at
            FROM Wardrobe_Item
            WHERE user_id = $1
            ORDER BY item_id DESC
            `,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching wardrobe:", error);

        res.status(500).json({
            error: "Failed to fetch wardrobe items",
        });
    }
});

/*
========================================================
ADD WARDROBE ITEM
========================================================
*/
router.post("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const {
            item_name,
            category,
            sub_category,
            brand,
            color,
            pattern,
            material,
            season,
            image_url,
            source_type,
            shopping_url,
            price,
            favorite,
        } = req.body;

        if (!item_name || !item_name.trim()) {
            return res.status(400).json({
                error: "Item name is required",
            });
        }

        if (!category) {
            return res.status(400).json({
                error: "Category is required",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO Wardrobe_Item
            (
                user_id,
                item_name,
                category,
                sub_category,
                brand,
                color,
                pattern,
                material,
                season,
                image_url,
                source_type,
                shopping_url,
                price,
                favorite
            )
            VALUES
            (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, $13, $14
            )
            RETURNING *
            `,
            [
                userId,
                item_name.trim(),
                category,
                sub_category || null,
                brand || null,
                color || null,
                pattern || null,
                material || null,
                season || null,
                image_url || null,
                source_type || "Upload",
                shopping_url || null,
                price || null,
                favorite ?? false,
            ]
        );

        res.status(201).json({
            message: "Wardrobe item added successfully",
            item: result.rows[0],
        });
    } catch (error) {
        console.error("Error adding wardrobe item:", error);

        res.status(500).json({
            error: "Failed to add wardrobe item",
        });
    }
});

/*
========================================================
UPDATE WARDROBE ITEM
========================================================
*/
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const itemId = req.params.id;

        const {
            item_name,
            category,
            sub_category,
            brand,
            color,
            pattern,
            material,
            season,
            image_url,
            source_type,
            shopping_url,
            price,
            favorite,
        } = req.body;

        if (!item_name || !item_name.trim()) {
            return res.status(400).json({
                error: "Item name is required",
            });
        }

        if (!category) {
            return res.status(400).json({
                error: "Category is required",
            });
        }

        const result = await pool.query(
            `
            UPDATE Wardrobe_Item
            SET
                item_name = $1,
                category = $2,
                sub_category = $3,
                brand = $4,
                color = $5,
                pattern = $6,
                material = $7,
                season = $8,
                image_url = $9,
                source_type = $10,
                shopping_url = $11,
                price = $12,
                favorite = $13,
                updated_at = CURRENT_TIMESTAMP
            WHERE item_id = $14
              AND user_id = $15
            RETURNING *
            `,
            [
                item_name.trim(),
                category,
                sub_category || null,
                brand || null,
                color || null,
                pattern || null,
                material || null,
                season || null,
                image_url || null,
                source_type || "Upload",
                shopping_url || null,
                price || null,
                favorite ?? false,
                itemId,
                userId,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Wardrobe item not found",
            });
        }

        res.json({
            message: "Wardrobe item updated successfully",
            item: result.rows[0],
        });
    } catch (error) {
        console.error("Error updating wardrobe item:", error);

        res.status(500).json({
            error: "Failed to update wardrobe item",
        });
    }
});

/*
========================================================
UPDATE FAVORITE STATUS
========================================================
*/
router.patch("/:id/favorite", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const itemId = req.params.id;
        const { favorite } = req.body;

        if (typeof favorite !== "boolean") {
            return res.status(400).json({
                error: "favorite must be true or false",
            });
        }

        const result = await pool.query(
            `
            UPDATE Wardrobe_Item
            SET
                favorite = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE item_id = $2
              AND user_id = $3
            RETURNING *
            `,
            [favorite, itemId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Wardrobe item not found",
            });
        }

        res.json({
            message: "Favorite status updated successfully",
            item: result.rows[0],
        });
    } catch (error) {
        console.error("Error updating favorite:", error);

        res.status(500).json({
            error: "Failed to update favorite status",
        });
    }
});

/*
========================================================
DELETE WARDROBE ITEM
========================================================
*/
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const itemId = req.params.id;

        // Find item first so we know which image belongs to it.
        const findResult = await pool.query(
            `
            SELECT
                item_id,
                item_name,
                image_url
            FROM Wardrobe_Item
            WHERE item_id = $1
              AND user_id = $2
            `,
            [itemId, userId]
        );

        if (findResult.rows.length === 0) {
            return res.status(404).json({
                error: "Wardrobe item not found",
            });
        }

        const item = findResult.rows[0];

        /*
        Delete the Supabase image if this item uses an image
        from our wardrobe-images bucket.
        */
        if (
            item.image_url &&
            item.image_url.includes(
                "/storage/v1/object/public/wardrobe-images/"
            )
        ) {
            const marker = "/wardrobe-images/";
            const markerIndex = item.image_url.indexOf(marker);

            if (markerIndex !== -1) {
                const filePath = item.image_url.substring(
                    markerIndex + marker.length
                );

                const bucket =
                    process.env.SUPABASE_BUCKET ||
                    "wardrobe-images";

                const { error: storageError } =
                    await supabase.storage
                        .from(bucket)
                        .remove([filePath]);

                if (storageError) {
                    console.error(
                        "Supabase image delete error:",
                        storageError
                    );
                }
            }
        }

        const deleteResult = await pool.query(
            `
            DELETE FROM Wardrobe_Item
            WHERE item_id = $1
              AND user_id = $2
            RETURNING *
            `,
            [itemId, userId]
        );

        res.json({
            message: "Wardrobe item deleted successfully",
            item: deleteResult.rows[0],
        });
    } catch (error) {
        console.error("Error deleting wardrobe item:", error);

        res.status(500).json({
            error: "Failed to delete wardrobe item",
        });
    }
});

module.exports = router;