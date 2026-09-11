const express = require("express");
const router = express.Router();

const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const ALLOWED_CATEGORIES = [
    "Tops",
    "Bottoms",
    "Dresses",
    "Shoes",
    "Outerwear",
];

const ALLOWED_SOURCE_TYPES = [
    "wardrobe",
    "wishlist",
    "upload",
];

// ==========================================================
// HELPERS
// ==========================================================

function areCategoriesCompatible(existingCategories, newCategory) {
    // Only one item from each category
    if (existingCategories.includes(newCategory)) {
        return {
            allowed: false,
            message: `A ${newCategory} item is already selected.`,
        };
    }

    const hasTop = existingCategories.includes("Tops");
    const hasBottom = existingCategories.includes("Bottoms");
    const hasDress = existingCategories.includes("Dresses");

    // Dress cannot be combined with Top or Bottom
    if (
        newCategory === "Dresses" &&
        (hasTop || hasBottom)
    ) {
        return {
            allowed: false,
            message:
                "A dress cannot be combined with tops or bottoms.",
        };
    }

    // Top cannot be combined with Dress
    if (
        newCategory === "Tops" &&
        hasDress
    ) {
        return {
            allowed: false,
            message:
                "Tops cannot be combined with a dress.",
        };
    }

    // Bottom cannot be combined with Dress
    if (
        newCategory === "Bottoms" &&
        hasDress
    ) {
        return {
            allowed: false,
            message:
                "Bottoms cannot be combined with a dress.",
        };
    }

    return {
        allowed: true,
    };
}

async function clearOldTryOnResult(
    db,
    sessionId,
    userId
) {
    await db.query(
        `
    UPDATE TryOn_Session
    SET
      result_image = NULL,
      fit_confidence = NULL,
      size_prediction = NULL,
      is_saved = FALSE,
      saved_at = NULL
    WHERE session_id = $1
      AND user_id = $2
    `,
        [sessionId, userId]
    );
}

// ==========================================================
// CREATE EMPTY TRY-ON SESSION
// POST /api/tryon
// ==========================================================

router.post(
    "/",
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.user_id;

            const result = await pool.query(
                `
        INSERT INTO TryOn_Session (
          user_id,
          is_saved,
          saved_at
        )
        VALUES ($1, FALSE, NULL)
        RETURNING *
        `,
                [userId]
            );

            res.status(201).json({
                message:
                    "Try-on session created successfully",
                session: result.rows[0],
            });
        } catch (error) {
            console.error(
                "Error creating try-on session:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to create try-on session",
            });
        }
    }
);

// ==========================================================
// GET ALL TRY-ON SESSIONS FOR CURRENT USER
// GET /api/tryon
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
          session_id,
          user_id,
          outfit_id,
          uploaded_image,
          avatar_image,
          result_image,
          fit_confidence,
          size_prediction,
          is_saved,
          saved_at,
          created_at
        FROM TryOn_Session
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
                [userId]
            );

            res.json(result.rows);
        } catch (error) {
            console.error(
                "Error fetching try-on sessions:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to fetch try-on sessions",
            });
        }
    }
);

// ==========================================================
// GET SAVED TRY-ON RESULTS
// GET /api/tryon/saved
// IMPORTANT: must be before /:id
// ==========================================================

router.get(
    "/saved",
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.user_id;

            const sessionsResult =
                await pool.query(
                    `
          SELECT
            session_id,
            user_id,
            outfit_id,
            uploaded_image,
            avatar_image,
            result_image,
            fit_confidence,
            size_prediction,
            is_saved,
            saved_at,
            created_at
          FROM TryOn_Session
          WHERE user_id = $1
            AND is_saved = TRUE
          ORDER BY saved_at DESC NULLS LAST,
                   created_at DESC
          `,
                    [userId]
                );

            const sessions = [];

            for (const session of sessionsResult.rows) {
                const itemsResult =
                    await pool.query(
                        `
            SELECT
              tryon_selected_item_id,
              session_id,
              source_type,
              source_item_id,
              category,
              item_name,
              image_url
            FROM TryOn_Selected_Item
            WHERE session_id = $1
            ORDER BY tryon_selected_item_id ASC
            `,
                        [session.session_id]
                    );

                sessions.push({
                    ...session,
                    selected_items:
                        itemsResult.rows,
                });
            }

            res.json(sessions);
        } catch (error) {
            console.error(
                "Error fetching saved try-ons:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to fetch saved try-ons",
            });
        }
    }
);

// ==========================================================
// ADD ITEM TO TRY-ON SESSION
// POST /api/tryon/:id/items
// ==========================================================

router.post(
    "/:id/items",
    authenticateToken,
    async (req, res) => {
        const client =
            await pool.connect();

        try {
            await client.query("BEGIN");

            const sessionId =
                parseInt(req.params.id, 10);

            const userId =
                req.user.user_id;

            const {
                source_type,
                source_item_id,
                category,
                item_name,
                image_url,
            } = req.body;

            // Validate session ID
            if (Number.isNaN(sessionId)) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    error:
                        "Invalid try-on session ID",
                });
            }

            // Validate source
            if (
                !ALLOWED_SOURCE_TYPES.includes(
                    source_type
                )
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    error:
                        "Invalid source type",
                });
            }

            // Validate category
            if (
                !ALLOWED_CATEGORIES.includes(
                    category
                )
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    error:
                        "Invalid try-on category",
                });
            }

            // Make sure session belongs to user
            const sessionResult =
                await client.query(
                    `
          SELECT session_id
          FROM TryOn_Session
          WHERE session_id = $1
            AND user_id = $2
          `,
                    [sessionId, userId]
                );

            if (
                sessionResult.rows.length === 0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    error:
                        "Try-on session not found",
                });
            }

            // ======================================================
            // VALIDATE WARDROBE OWNERSHIP
            // ======================================================

            if (
                source_type === "wardrobe"
            ) {
                if (!source_item_id) {
                    await client.query(
                        "ROLLBACK"
                    );

                    return res
                        .status(400)
                        .json({
                            error:
                                "Wardrobe item ID is required",
                        });
                }

                const wardrobeResult =
                    await client.query(
                        `
            SELECT item_id
            FROM Wardrobe_Item
            WHERE item_id = $1
              AND user_id = $2
            `,
                        [
                            source_item_id,
                            userId,
                        ]
                    );

                if (
                    wardrobeResult.rows
                        .length === 0
                ) {
                    await client.query(
                        "ROLLBACK"
                    );

                    return res
                        .status(404)
                        .json({
                            error:
                                "Wardrobe item not found",
                        });
                }
            }

            // ======================================================
            // VALIDATE WISHLIST OWNERSHIP
            // ======================================================

            if (
                source_type === "wishlist"
            ) {
                if (!source_item_id) {
                    await client.query(
                        "ROLLBACK"
                    );

                    return res
                        .status(400)
                        .json({
                            error:
                                "Wishlist item ID is required",
                        });
                }

                const wishlistResult =
                    await client.query(
                        `
            SELECT wishlist_id
            FROM Wishlist
            WHERE wishlist_id = $1
              AND user_id = $2
            `,
                        [
                            source_item_id,
                            userId,
                        ]
                    );

                if (
                    wishlistResult.rows
                        .length === 0
                ) {
                    await client.query(
                        "ROLLBACK"
                    );

                    return res
                        .status(404)
                        .json({
                            error:
                                "Wishlist item not found",
                        });
                }
            }

            // ======================================================
            // GET EXISTING CATEGORIES
            // ======================================================

            const existingResult =
                await client.query(
                    `
          SELECT category
          FROM TryOn_Selected_Item
          WHERE session_id = $1
          `,
                    [sessionId]
                );

            const existingCategories =
                existingResult.rows.map(
                    (row) => row.category
                );

            const compatibility =
                areCategoriesCompatible(
                    existingCategories,
                    category
                );

            if (!compatibility.allowed) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    error:
                        compatibility.message,
                });
            }

            // ======================================================
            // INSERT ITEM
            // ======================================================

            const insertResult =
                await client.query(
                    `
          INSERT INTO TryOn_Selected_Item (
            session_id,
            source_type,
            source_item_id,
            category,
            item_name,
            image_url
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
          RETURNING *
          `,
                    [
                        sessionId,
                        source_type,
                        source_item_id || null,
                        category,
                        item_name || null,
                        image_url || null,
                    ]
                );

            // ======================================================
            // IMPORTANT:
            // Clothing changed, so old AI result is no longer valid
            // ======================================================

            await clearOldTryOnResult(
                client,
                sessionId,
                userId
            );

            await client.query("COMMIT");

            res.status(201).json({
                message:
                    "Try-on item added successfully",
                item: insertResult.rows[0],
            });
        } catch (error) {
            await client.query(
                "ROLLBACK"
            );

            console.error(
                "Error adding try-on item:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to add try-on item",
            });
        } finally {
            client.release();
        }
    }
);

// ==========================================================
// GET SELECTED ITEMS FOR SESSION
// GET /api/tryon/:id/items
// ==========================================================

router.get(
    "/:id/items",
    authenticateToken,
    async (req, res) => {
        try {
            const sessionId =
                parseInt(req.params.id, 10);

            const userId =
                req.user.user_id;

            if (Number.isNaN(sessionId)) {
                return res.status(400).json({
                    error:
                        "Invalid try-on session ID",
                });
            }

            const sessionResult =
                await pool.query(
                    `
          SELECT session_id
          FROM TryOn_Session
          WHERE session_id = $1
            AND user_id = $2
          `,
                    [sessionId, userId]
                );

            if (
                sessionResult.rows.length === 0
            ) {
                return res.status(404).json({
                    error:
                        "Try-on session not found",
                });
            }

            const result =
                await pool.query(
                    `
          SELECT
            tryon_selected_item_id,
            session_id,
            source_type,
            source_item_id,
            category,
            item_name,
            image_url
          FROM TryOn_Selected_Item
          WHERE session_id = $1
          ORDER BY tryon_selected_item_id ASC
          `,
                    [sessionId]
                );

            res.json(result.rows);
        } catch (error) {
            console.error(
                "Error fetching try-on items:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to fetch try-on items",
            });
        }
    }
);

// ==========================================================
// REMOVE SELECTED CATEGORY
// DELETE /api/tryon/:id/items/:category
// ==========================================================

router.delete(
    "/:id/items/:category",
    authenticateToken,
    async (req, res) => {
        const client =
            await pool.connect();

        try {
            await client.query("BEGIN");

            const sessionId =
                parseInt(req.params.id, 10);

            const userId =
                req.user.user_id;

            const category =
                req.params.category;

            if (Number.isNaN(sessionId)) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    error:
                        "Invalid try-on session ID",
                });
            }

            if (
                !ALLOWED_CATEGORIES.includes(
                    category
                )
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    error:
                        "Invalid try-on category",
                });
            }

            const sessionResult =
                await client.query(
                    `
          SELECT session_id
          FROM TryOn_Session
          WHERE session_id = $1
            AND user_id = $2
          `,
                    [sessionId, userId]
                );

            if (
                sessionResult.rows.length === 0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    error:
                        "Try-on session not found",
                });
            }

            const deleteResult =
                await client.query(
                    `
          DELETE FROM TryOn_Selected_Item
          WHERE session_id = $1
            AND category = $2
          RETURNING *
          `,
                    [
                        sessionId,
                        category,
                    ]
                );

            if (
                deleteResult.rows.length === 0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    error:
                        "Selected item not found",
                });
            }

            // ======================================================
            // IMPORTANT:
            // Clothing changed, so clear old AI result
            // ======================================================

            await clearOldTryOnResult(
                client,
                sessionId,
                userId
            );

            await client.query("COMMIT");

            res.json({
                message:
                    "Selected item removed successfully",
                item: deleteResult.rows[0],
            });
        } catch (error) {
            await client.query(
                "ROLLBACK"
            );

            console.error(
                "Error removing try-on item:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to remove try-on item",
            });
        } finally {
            client.release();
        }
    }
);

// ==========================================================
// GET ONE TRY-ON SESSION + ALL SELECTED ITEMS
// GET /api/tryon/:id
//
// THIS IS THE MAIN AI HANDOFF ENDPOINT
// ==========================================================

router.get(
    "/:id",
    authenticateToken,
    async (req, res) => {
        try {
            const sessionId =
                parseInt(req.params.id, 10);

            const userId =
                req.user.user_id;

            if (Number.isNaN(sessionId)) {
                return res.status(400).json({
                    error:
                        "Invalid try-on session ID",
                });
            }

            const sessionResult =
                await pool.query(
                    `
          SELECT
            session_id,
            user_id,
            outfit_id,
            uploaded_image,
            avatar_image,
            result_image,
            fit_confidence,
            size_prediction,
            is_saved,
            saved_at,
            created_at
          FROM TryOn_Session
          WHERE session_id = $1
            AND user_id = $2
          `,
                    [sessionId, userId]
                );

            if (
                sessionResult.rows.length === 0
            ) {
                return res.status(404).json({
                    error:
                        "Try-on session not found",
                });
            }

            const itemsResult =
                await pool.query(
                    `
          SELECT
            tryon_selected_item_id,
            session_id,
            source_type,
            source_item_id,
            category,
            item_name,
            image_url
          FROM TryOn_Selected_Item
          WHERE session_id = $1
          ORDER BY tryon_selected_item_id ASC
          `,
                    [sessionId]
                );

            res.json({
                ...sessionResult.rows[0],
                selected_items:
                    itemsResult.rows,
            });
        } catch (error) {
            console.error(
                "Error fetching try-on session:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to fetch try-on session",
            });
        }
    }
);

// ==========================================================
// UPDATE AI RESULT
// PATCH /api/tryon/:id/result
//
// Friend 1's AI can use this after generation.
// ==========================================================

router.patch(
    "/:id/result",
    authenticateToken,
    async (req, res) => {
        try {
            const sessionId =
                parseInt(req.params.id, 10);

            const userId =
                req.user.user_id;

            const {
                result_image,
                fit_confidence,
                size_prediction,
            } = req.body;

            if (Number.isNaN(sessionId)) {
                return res.status(400).json({
                    error:
                        "Invalid try-on session ID",
                });
            }

            if (!result_image) {
                return res.status(400).json({
                    error:
                        "result_image is required",
                });
            }

            const result =
                await pool.query(
                    `
          UPDATE TryOn_Session
          SET
            result_image = $1,
            fit_confidence = $2,
            size_prediction = $3,
            is_saved = FALSE,
            saved_at = NULL
          WHERE session_id = $4
            AND user_id = $5
          RETURNING *
          `,
                    [
                        result_image,
                        fit_confidence || null,
                        size_prediction || null,
                        sessionId,
                        userId,
                    ]
                );

            if (
                result.rows.length === 0
            ) {
                return res.status(404).json({
                    error:
                        "Try-on session not found",
                });
            }

            res.json({
                message:
                    "Try-on result updated successfully",
                session: result.rows[0],
            });
        } catch (error) {
            console.error(
                "Error updating try-on result:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to update try-on result",
            });
        }
    }
);

// ==========================================================
// SAVE FINAL TRY-ON RESULT
// PATCH /api/tryon/:id/save
// ==========================================================

router.patch(
    "/:id/save",
    authenticateToken,
    async (req, res) => {
        try {
            const sessionId =
                parseInt(req.params.id, 10);

            const userId =
                req.user.user_id;

            if (Number.isNaN(sessionId)) {
                return res.status(400).json({
                    error:
                        "Invalid try-on session ID",
                });
            }

            const sessionResult =
                await pool.query(
                    `
          SELECT
            session_id,
            result_image
          FROM TryOn_Session
          WHERE session_id = $1
            AND user_id = $2
          `,
                    [sessionId, userId]
                );

            if (
                sessionResult.rows.length === 0
            ) {
                return res.status(404).json({
                    error:
                        "Try-on session not found",
                });
            }

            // Only save a real generated result
            if (
                !sessionResult.rows[0]
                    .result_image
            ) {
                return res.status(400).json({
                    error:
                        "Try-on result is not ready yet",
                });
            }

            const result =
                await pool.query(
                    `
          UPDATE TryOn_Session
          SET
            is_saved = TRUE,
            saved_at = CURRENT_TIMESTAMP
          WHERE session_id = $1
            AND user_id = $2
          RETURNING *
          `,
                    [sessionId, userId]
                );

            res.json({
                message:
                    "Try-on outfit saved successfully",
                session: result.rows[0],
            });
        } catch (error) {
            console.error(
                "Error saving try-on:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to save try-on outfit",
            });
        }
    }
);

// ==========================================================
// UNSAVE TRY-ON RESULT
// PATCH /api/tryon/:id/unsave
// ==========================================================

router.patch(
    "/:id/unsave",
    authenticateToken,
    async (req, res) => {
        try {
            const sessionId =
                parseInt(req.params.id, 10);

            const userId =
                req.user.user_id;

            if (Number.isNaN(sessionId)) {
                return res.status(400).json({
                    error:
                        "Invalid try-on session ID",
                });
            }

            const result =
                await pool.query(
                    `
          UPDATE TryOn_Session
          SET
            is_saved = FALSE,
            saved_at = NULL
          WHERE session_id = $1
            AND user_id = $2
          RETURNING *
          `,
                    [sessionId, userId]
                );

            if (
                result.rows.length === 0
            ) {
                return res.status(404).json({
                    error:
                        "Try-on session not found",
                });
            }

            res.json({
                message:
                    "Try-on outfit removed from saved outfits",
                session: result.rows[0],
            });
        } catch (error) {
            console.error(
                "Error unsaving try-on:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to unsave try-on outfit",
            });
        }
    }
);

module.exports = router;