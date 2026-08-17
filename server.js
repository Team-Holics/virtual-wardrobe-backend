const express = require("express");
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authenticateToken = require("./authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Smart Fashion Assistant Backend is running",
    });
});

app.get("/api/users", async (req, res) => {
    try {
        const result = await pool.query(`
  SELECT
    user_id,
    full_name,
    email,
    profile_image,
    account_status,
    created_at,
    updated_at
  FROM "User"
  ORDER BY user_id
`);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            error: "Failed to fetch users",
        });
    }
});

app.get("/api/wardrobe", authenticateToken, async (req, res) => {
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
      ORDER BY item_id
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

app.post("/api/auth/register", async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                error: "Full name, email and password are required",
            });
        }

        const existingUser = await pool.query(
            'SELECT user_id FROM "User" WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: "Email is already registered",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `
      INSERT INTO "User"
      (full_name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING
        user_id,
        full_name,
        email,
        profile_image,
        account_status,
        created_at,
        updated_at
      `,
            [full_name, email, passwordHash]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            error: "Registration failed",
        });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }

        const result = await pool.query(
            `
      SELECT
        user_id,
        full_name,
        email,
        password_hash,
        profile_image,
        account_status
      FROM "User"
      WHERE email = $1
      `,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        const user = result.rows[0];

        if (user.account_status !== "Active") {
            return res.status(403).json({
                error: "Account is not active",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                profile_image: user.profile_image,
                account_status: user.account_status,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            error: "Login failed",
        });
    }
});

app.get("/api/profile", authenticateToken, async (req, res) => {
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

app.put("/api/profile", authenticateToken, async (req, res) => {
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

app.post("/api/wardrobe", authenticateToken, async (req, res) => {
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

        if (!item_name) {
            return res.status(400).json({
                error: "Item name is required",
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
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
      `,
            [
                userId,
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

app.put("/api/wardrobe/:id", authenticateToken, async (req, res) => {
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

app.delete("/api/wardrobe/:id", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const itemId = req.params.id;

        const result = await pool.query(
            `
      DELETE FROM Wardrobe_Item
      WHERE item_id = $1
        AND user_id = $2
      RETURNING item_id, item_name
      `,
            [itemId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Wardrobe item not found",
            });
        }

        res.json({
            message: "Wardrobe item deleted successfully",
            item: result.rows[0],
        });
    } catch (error) {
        console.error("Error deleting wardrobe item:", error);

        res.status(500).json({
            error: "Failed to delete wardrobe item",
        });
    }
});

app.patch(
    "/api/wardrobe/:id/favorite",
    authenticateToken,
    async (req, res) => {
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
    }
);

app.post("/api/outfits", authenticateToken, async (req, res) => {
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

app.get("/api/outfits", authenticateToken, async (req, res) => {
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

app.delete("/api/outfits/:id", authenticateToken, async (req, res) => {
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

app.post("/api/wishlist", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { outfit_id } = req.body;

        if (!outfit_id) {
            return res.status(400).json({
                error: "Outfit ID is required",
            });
        }

        // Make sure the outfit exists
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

        // Prevent duplicate wishlist entries
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

app.get("/api/wishlist", authenticateToken, async (req, res) => {
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

app.delete(
    "/api/wishlist/:outfitId",
    authenticateToken,
    async (req, res) => {
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
    }
);

app.post("/api/tryon", authenticateToken, async (req, res) => {
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

        // If an outfit is provided, make sure it belongs to this user
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
                fit_confidence || null,
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

app.get("/api/tryon", authenticateToken, async (req, res) => {
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

app.post("/api/recommendations", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const {
            prompt,
            occasion,
            weather,
            recommended_outfit,
            score,
        } = req.body;

        if (!prompt) {
            return res.status(400).json({
                error: "Prompt is required",
            });
        }

        const result = await pool.query(
            `
      INSERT INTO AI_Recommendation
      (
        user_id,
        prompt,
        occasion,
        weather,
        recommended_outfit,
        score
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
            [
                userId,
                prompt,
                occasion || null,
                weather || null,
                recommended_outfit || null,
                score ?? null,
            ]
        );

        res.status(201).json({
            message: "Recommendation saved successfully",
            recommendation: result.rows[0],
        });

    } catch (error) {
        console.error("Recommendation error:", error);

        res.status(500).json({
            error: "Failed to save recommendation",
        });
    }
});

app.get("/api/recommendations", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
      SELECT
        recommendation_id,
        user_id,
        prompt,
        occasion,
        weather,
        recommended_outfit,
        score,
        created_at
      FROM AI_Recommendation
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Error fetching recommendations:", error);

        res.status(500).json({
            error: "Failed to fetch recommendations",
        });
    }
});

app.post("/api/conversations", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { user_message, ai_response } = req.body;

        if (!user_message || !ai_response) {
            return res.status(400).json({
                error: "User message and AI response are required",
            });
        }

        const result = await pool.query(
            `
      INSERT INTO AI_Conversation
      (
        user_id,
        user_message,
        ai_response
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `,
            [userId, user_message, ai_response]
        );

        res.status(201).json({
            message: "Conversation saved successfully",
            conversation: result.rows[0],
        });
    } catch (error) {
        console.error("Conversation error:", error);

        res.status(500).json({
            error: "Failed to save conversation",
        });
    }
});

app.get("/api/conversations", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
      SELECT
        conversation_id,
        user_id,
        user_message,
        ai_response,
        created_at
      FROM AI_Conversation
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching conversations:", error);

        res.status(500).json({
            error: "Failed to fetch conversations",
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});