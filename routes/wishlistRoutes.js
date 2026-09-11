const express = require("express");
const router = express.Router();

const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const supabase = require("../supabaseClient");

const WISHLIST_BUCKET =
    process.env.SUPABASE_WISHLIST_BUCKET || "wishlist-images";

const ALLOWED_AI_CATEGORIES = [
    "Tops",
    "Bottoms",
    "Dresses",
    "Shoes",
    "Outerwear",
];

// ==========================================================
// HELPER
// Extract Supabase storage path from public image URL
// ==========================================================

function getSupabaseStoragePath(imageUrl) {
    if (!imageUrl || typeof imageUrl !== "string") {
        return null;
    }

    try {
        const marker = `/storage/v1/object/public/${WISHLIST_BUCKET}/`;

        const markerIndex = imageUrl.indexOf(marker);

        if (markerIndex === -1) {
            return null;
        }

        return imageUrl.substring(
            markerIndex + marker.length
        );
    } catch (error) {
        console.error(
            "Error extracting Supabase storage path:",
            error
        );

        return null;
    }
}

// ==========================================================
// GET ALL WISHLIST ITEMS FOR CURRENT USER
// GET /api/wishlist
// ==========================================================

router.get(
    "/",
    authenticateToken,
    async (req, res) => {
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
          ai_category,
          created_at
        FROM Wishlist
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
                [userId]
            );

            res.json(result.rows);
        } catch (error) {
            console.error(
                "Error fetching wishlist:",
                error
            );

            res.status(500).json({
                error: "Failed to load wishlist",
            });
        }
    }
);

// ==========================================================
// CREATE WISHLIST ITEM
// POST /api/wishlist
// ==========================================================

router.post(
    "/",
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.user_id;

            const {
                item_name,
                brand,
                source,
                price,
                image_url,
                ai_category,
            } = req.body;

            // ------------------------------------------------------
            // Validation
            // ------------------------------------------------------

            if (
                !item_name ||
                !String(item_name).trim()
            ) {
                return res.status(400).json({
                    error: "Item name is required",
                });
            }

            let normalizedCategory = null;

            if (
                ai_category !== undefined &&
                ai_category !== null &&
                String(ai_category).trim() !== ""
            ) {
                normalizedCategory =
                    String(ai_category).trim();

                if (
                    !ALLOWED_AI_CATEGORIES.includes(
                        normalizedCategory
                    )
                ) {
                    return res.status(400).json({
                        error:
                            "Invalid AI category. Allowed categories are Tops, Bottoms, Dresses, Shoes, and Outerwear.",
                    });
                }
            }

            // ------------------------------------------------------
            // Price normalization
            // ------------------------------------------------------

            let normalizedPrice = null;

            if (
                price !== undefined &&
                price !== null &&
                String(price).trim() !== ""
            ) {
                const parsedPrice =
                    Number(price);

                if (
                    Number.isNaN(parsedPrice) ||
                    parsedPrice < 0
                ) {
                    return res.status(400).json({
                        error:
                            "Price must be a valid non-negative number",
                    });
                }

                normalizedPrice =
                    parsedPrice;
            }

            // ------------------------------------------------------
            // Insert
            // ------------------------------------------------------

            const result = await pool.query(
                `
        INSERT INTO Wishlist (
          user_id,
          item_name,
          brand,
          source,
          price,
          image_url,
          ai_category
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        RETURNING
          wishlist_id,
          user_id,
          item_name,
          brand,
          source,
          price,
          image_url,
          ai_category,
          created_at
        `,
                [
                    userId,
                    String(item_name).trim(),
                    brand
                        ? String(brand).trim()
                        : null,
                    source
                        ? String(source).trim()
                        : null,
                    normalizedPrice,
                    image_url || null,
                    normalizedCategory,
                ]
            );

            res.status(201).json({
                message:
                    "Wishlist item added successfully",
                item: result.rows[0],
            });
        } catch (error) {
            console.error(
                "Error adding wishlist item:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to add wishlist item",
            });
        }
    }
);

// ==========================================================
// UPDATE AI CATEGORY
//
// This route does NOT perform AI classification.
// Friend 1's AI can use it later after classifying an item.
//
// PATCH /api/wishlist/:wishlistId/category
// ==========================================================

router.patch(
    "/:wishlistId/category",
    authenticateToken,
    async (req, res) => {
        try {
            const userId =
                req.user.user_id;

            const wishlistId =
                parseInt(
                    req.params.wishlistId,
                    10
                );

            const { ai_category } =
                req.body;

            if (
                Number.isNaN(wishlistId)
            ) {
                return res.status(400).json({
                    error:
                        "Invalid wishlist item ID",
                });
            }

            let normalizedCategory =
                null;

            if (
                ai_category !== undefined &&
                ai_category !== null &&
                String(ai_category).trim() !== ""
            ) {
                normalizedCategory =
                    String(ai_category).trim();

                if (
                    !ALLOWED_AI_CATEGORIES.includes(
                        normalizedCategory
                    )
                ) {
                    return res.status(400).json({
                        error:
                            "Invalid AI category. Allowed categories are Tops, Bottoms, Dresses, Shoes, and Outerwear.",
                    });
                }
            }

            const result =
                await pool.query(
                    `
          UPDATE Wishlist
          SET ai_category = $1
          WHERE wishlist_id = $2
            AND user_id = $3
          RETURNING
            wishlist_id,
            user_id,
            item_name,
            brand,
            source,
            price,
            image_url,
            ai_category,
            created_at
          `,
                    [
                        normalizedCategory,
                        wishlistId,
                        userId,
                    ]
                );

            if (
                result.rows.length === 0
            ) {
                return res.status(404).json({
                    error:
                        "Wishlist item not found",
                });
            }

            res.json({
                message:
                    "Wishlist category updated successfully",
                item: result.rows[0],
            });
        } catch (error) {
            console.error(
                "Error updating wishlist category:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to update wishlist category",
            });
        }
    }
);

// ==========================================================
// DELETE WISHLIST ITEM
// DELETE /api/wishlist/:wishlistId
// ==========================================================

router.delete(
    "/:wishlistId",
    authenticateToken,
    async (req, res) => {
        const client =
            await pool.connect();

        try {
            const userId =
                req.user.user_id;

            const wishlistId =
                parseInt(
                    req.params.wishlistId,
                    10
                );

            if (
                Number.isNaN(wishlistId)
            ) {
                return res.status(400).json({
                    error:
                        "Invalid wishlist item ID",
                });
            }

            await client.query("BEGIN");

            // ------------------------------------------------------
            // Find item first
            // ------------------------------------------------------

            const itemResult =
                await client.query(
                    `
          SELECT
            wishlist_id,
            image_url
          FROM Wishlist
          WHERE wishlist_id = $1
            AND user_id = $2
          FOR UPDATE
          `,
                    [
                        wishlistId,
                        userId,
                    ]
                );

            if (
                itemResult.rows.length === 0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    error:
                        "Wishlist item not found",
                });
            }

            const wishlistItem =
                itemResult.rows[0];

            const imageUrl =
                wishlistItem.image_url;

            // ------------------------------------------------------
            // Delete DB record
            // ------------------------------------------------------

            const deleteResult =
                await client.query(
                    `
          DELETE FROM Wishlist
          WHERE wishlist_id = $1
            AND user_id = $2
          RETURNING *
          `,
                    [
                        wishlistId,
                        userId,
                    ]
                );

            // ------------------------------------------------------
            // Check whether another Wishlist row still uses image
            // ------------------------------------------------------

            let shouldDeleteImage = false;

            if (imageUrl) {
                const referencesResult =
                    await client.query(
                        `
            SELECT COUNT(*)::integer AS count
            FROM Wishlist
            WHERE image_url = $1
            `,
                        [imageUrl]
                    );

                shouldDeleteImage =
                    referencesResult.rows[0]
                        .count === 0;
            }

            await client.query("COMMIT");

            // ------------------------------------------------------
            // Remove image from Supabase only when no DB row uses it
            // ------------------------------------------------------

            if (
                imageUrl &&
                shouldDeleteImage
            ) {
                const storagePath =
                    getSupabaseStoragePath(
                        imageUrl
                    );

                if (storagePath) {
                    const {
                        error: storageError,
                    } = await supabase.storage
                        .from(WISHLIST_BUCKET)
                        .remove([storagePath]);

                    if (storageError) {
                        // Do NOT fail the DB deletion just because
                        // storage cleanup failed.
                        console.error(
                            "Wishlist image cleanup error:",
                            storageError
                        );
                    }
                }
            }

            res.json({
                message:
                    "Wishlist item deleted successfully",
                item:
                    deleteResult.rows[0],
            });
        } catch (error) {
            try {
                await client.query(
                    "ROLLBACK"
                );
            } catch (
            rollbackError
            ) {
                console.error(
                    "Wishlist rollback error:",
                    rollbackError
                );
            }

            console.error(
                "Error deleting wishlist item:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to delete wishlist item",
            });
        } finally {
            client.release();
        }
    }
);

module.exports = router;