const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const supabase = require("../supabaseClient");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Only JPG, PNG, and WEBP images are allowed"
                )
            );
        }

        cb(null, true);
    },
});

router.post(
    "/wardrobe",
    authMiddleware,
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: "No image uploaded",
                });
            }

            const userId = req.user.user_id;

            const extension =
                path.extname(req.file.originalname).toLowerCase() ||
                ".jpg";

            const uniqueName = crypto.randomUUID();

            const filePath =
                `user-${userId}/${uniqueName}${extension}`;

            const bucket =
                process.env.SUPABASE_BUCKET || "wardrobe-images";

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false,
                });

            if (uploadError) {
                console.error(
                    "Supabase upload error:",
                    uploadError
                );

                return res.status(500).json({
                    error: "Failed to upload image",
                    details: uploadError.message,
                });
            }

            const { data: publicUrlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return res.status(201).json({
                message: "Image uploaded successfully",
                image_url: publicUrlData.publicUrl,
                path: filePath,
            });
        } catch (error) {
            console.error("Upload error:", error);

            return res.status(500).json({
                error: "Image upload failed",
                details: error.message,
            });
        }
    }
);
router.post(
    "/avatar",
    authMiddleware,
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: "No image uploaded",
                });
            }

            const userId = req.user.user_id;

            const extension =
                path.extname(req.file.originalname).toLowerCase() ||
                ".jpg";

            const uniqueName = crypto.randomUUID();

            const filePath =
                `user-${userId}/${uniqueName}${extension}`;

            const bucket =
                process.env.SUPABASE_AVATAR_BUCKET ||
                "profile-images";

            // Find current avatar first
            const pool = require("../db");

            const currentProfile = await pool.query(
                `
                SELECT avatar_image
                FROM Profile
                WHERE user_id = $1
                `,
                [userId]
            );

            const oldAvatar =
                currentProfile.rows[0]?.avatar_image;

            // Upload new avatar
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false,
                });

            if (uploadError) {
                console.error(
                    "Avatar upload error:",
                    uploadError
                );

                return res.status(500).json({
                    error: "Failed to upload avatar",
                    details: uploadError.message,
                });
            }

            const { data: publicUrlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            const avatarUrl = publicUrlData.publicUrl;

            // Save URL into Profile
            await pool.query(
                `
                INSERT INTO Profile
                    (user_id, avatar_image, updated_at)
                VALUES
                    ($1, $2, CURRENT_TIMESTAMP)

                ON CONFLICT (user_id)
                DO UPDATE SET
                    avatar_image = EXCLUDED.avatar_image,
                    updated_at = CURRENT_TIMESTAMP
                `,
                [userId, avatarUrl]
            );

            // Delete previous Supabase avatar when replacing it
            if (
                oldAvatar &&
                oldAvatar.includes(
                    "/storage/v1/object/public/profile-images/"
                )
            ) {
                const marker = "/profile-images/";
                const index = oldAvatar.indexOf(marker);

                if (index !== -1) {
                    const oldFilePath =
                        oldAvatar.substring(
                            index + marker.length
                        );

                    const { error: deleteError } =
                        await supabase.storage
                            .from(bucket)
                            .remove([oldFilePath]);

                    if (deleteError) {
                        console.error(
                            "Old avatar delete error:",
                            deleteError
                        );
                    }
                }
            }

            return res.status(201).json({
                message: "Avatar uploaded successfully",
                avatar_image: avatarUrl,
                path: filePath,
            });
        } catch (error) {
            console.error("Avatar upload error:", error);

            return res.status(500).json({
                error: "Avatar upload failed",
                details: error.message,
            });
        }
    }
);

router.post(
    "/tryon",
    authMiddleware,
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: "No image uploaded",
                });
            }

            const userId = req.user.user_id;

            const extension =
                path.extname(req.file.originalname).toLowerCase() ||
                ".jpg";

            const uniqueName = crypto.randomUUID();

            const filePath =
                `user-${userId}/uploads/${uniqueName}${extension}`;

            const bucket =
                process.env.SUPABASE_TRYON_BUCKET ||
                "tryon-images";

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false,
                });

            if (uploadError) {
                console.error(
                    "Try-on upload error:",
                    uploadError
                );

                return res.status(500).json({
                    error: "Failed to upload try-on image",
                    details: uploadError.message,
                });
            }

            const { data: publicUrlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return res.status(201).json({
                message: "Try-on image uploaded successfully",
                uploaded_image: publicUrlData.publicUrl,
                path: filePath,
            });
        } catch (error) {
            console.error(
                "Try-on image upload error:",
                error
            );

            return res.status(500).json({
                error: "Try-on image upload failed",
                details: error.message,
            });
        }
    }
);

router.post(
    "/tryon-result",
    authMiddleware,
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: "No result image uploaded",
                });
            }

            const userId = req.user.user_id;

            const extension =
                path.extname(req.file.originalname).toLowerCase() ||
                ".jpg";

            const uniqueName = crypto.randomUUID();

            const filePath =
                `user-${userId}/results/${uniqueName}${extension}`;

            const bucket =
                process.env.SUPABASE_TRYON_BUCKET ||
                "tryon-images";

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false,
                });

            if (uploadError) {
                console.error(
                    "Try-on result upload error:",
                    uploadError
                );

                return res.status(500).json({
                    error: "Failed to upload result image",
                    details: uploadError.message,
                });
            }

            const { data: publicUrlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return res.status(201).json({
                message: "Try-on result image uploaded successfully",
                result_image: publicUrlData.publicUrl,
                path: filePath,
            });
        } catch (error) {
            console.error(
                "Try-on result image upload error:",
                error
            );

            return res.status(500).json({
                error: "Try-on result image upload failed",
                details: error.message,
            });
        }
    }
);
module.exports = router;
