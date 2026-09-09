const express = require("express");
const supabase = require("../supabaseClient");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GET ALL WISHLIST ITEMS FOR LOGGED-IN USER
// =====================================================

router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
            SELECT
                wishlist_id,
                user_id,
                item_name,
                brand,
                source,
                price,
                image_url,
                created_at
            FROM Wishlist
            WHERE user_id = $1
            ORDER BY wishlist_id DESC
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


// =====================================================
// ADD WISHLIST ITEM
// =====================================================

router.post("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const {
            item_name,
            brand,
            source,
            price,
            image_url,
        } = req.body;

        if (!item_name || !item_name.trim()) {
            return res.status(400).json({
                error: "Item name is required",
            });
        }

        let parsedPrice = null;

        if (price !== undefined && price !== null && price !== "") {
            parsedPrice = Number(price);

            if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
                return res.status(400).json({
                    error: "Price must be a valid non-negative number",
                });
            }
        }

        const result = await pool.query(
            `
            INSERT INTO Wishlist
            (
                user_id,
                item_name,
                brand,
                source,
                price,
                image_url
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [
                userId,
                item_name.trim(),
                brand?.trim() || null,
                source?.trim() || null,
                parsedPrice,
                image_url || null,
            ]
        );

        res.status(201).json({
            message: "Wishlist item added successfully",
            wishlist: result.rows[0],
        });
    } catch (error) {
        console.error("Error adding wishlist item:", error);

        res.status(500).json({
            error: "Failed to add wishlist item",
        });
    }
});


// =====================================================
// DELETE WISHLIST ITEM
// =====================================================

router.delete("/:wishlistId", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const wishlistId = req.params.wishlistId;

        const result = await pool.query(
            `
            DELETE FROM Wishlist
            WHERE wishlist_id = $1
              AND user_id = $2
            RETURNING
                wishlist_id,
                image_url
            `,
            [wishlistId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Wishlist item not found",
            });
        }

        const deletedItem = result.rows[0];
        const imageUrl = deletedItem.image_url;

        if (imageUrl) {
            const referenceCheck = await pool.query(
                `
                SELECT COUNT(*)::int AS count
                FROM Wishlist
                WHERE image_url = $1
                `,
                [imageUrl]
            );

            const remainingReferences =
                referenceCheck.rows[0]?.count || 0;

            if (
                remainingReferences === 0 &&
                imageUrl.includes(
                    "/storage/v1/object/public/wishlist-images/"
                )
            ) {
                const marker = "/wishlist-images/";
                const index = imageUrl.indexOf(marker);

                if (index !== -1) {
                    const filePath = imageUrl.substring(
                        index + marker.length
                    );

                    const bucket =
                        process.env.SUPABASE_WISHLIST_BUCKET ||
                        "wishlist-images";

                    const { error: deleteError } =
                        await supabase.storage
                            .from(bucket)
                            .remove([filePath]);

                    if (deleteError) {
                        console.error(
                            "Wishlist image delete error:",
                            deleteError
                        );
                    }
                }
            }
        }

        res.json({
            message: "Wishlist item deleted successfully",
            wishlist: deletedItem,
        });
    } catch (error) {
        console.error(
            "Error deleting wishlist item:",
            error
        );

        res.status(500).json({
            error: "Failed to delete wishlist item",
        });
    }
});


module.exports = router;