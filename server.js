const express = require("express");
const cors = require("cors");
const pool = require("./db");
const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const wardrobeRoutes = require("./routes/wardrobeRoutes");
const outfitRoutes = require("./routes/outfitRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const tryonRoutes = require("./routes/tryonRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const savedOutfitRoutes = require("./routes/savedOutfitRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/wardrobe", wardrobeRoutes);
app.use("/api/outfits", outfitRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/tryon", tryonRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/saved-outfits", savedOutfitRoutes);

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
