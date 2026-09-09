import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://127.0.0.1:3000";

const STYLE_VIBES = [
  "Casual",
  "Streetwear",
  "Minimalist",
  "Formal",
  "Boho",
  "Sporty",
];

type ProfileData = {
  user_id?: number;
  full_name?: string;
  email?: string;
  height?: number | string | null;
  weight?: number | string | null;
  chest?: number | string | null;
  waist?: number | string | null;
  hip?: number | string | null;
  shoulder_width?: number | string | null;
  style_preferences?: string | null;
  avatar_image?: string | null;
};

const toInputValue = (
  value: number | string | null | undefined
) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const toNumberOrNull = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const number = Number(trimmed);

  if (Number.isNaN(number)) {
    return null;
  }

  return number;
};

export default function ProfileEditScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  const [fullName, setFullName] = useState("User");
  const [avatarImage, setAvatarImage] =
    useState<string | null>(null);

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [shoulderWidth, setShoulderWidth] =
    useState("");

  const [styles_, setStyles] = useState<string[]>([]);

  const getToken = async () => {
    return await SecureStore.getItemAsync("authToken");
  };

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const token =
        await SecureStore.getItemAsync("authToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: ProfileData = await response.json();

      if (!response.ok) {
        throw new Error(
          (data as any).error ||
          (data as any).message ||
          "Failed to load profile."
        );
      }

      setFullName(data.full_name || "User");
      setAvatarImage(data.avatar_image || null);

      setHeight(toInputValue(data.height));
      setWeight(toInputValue(data.weight));
      setChest(toInputValue(data.chest));
      setWaist(toInputValue(data.waist));
      setHip(toInputValue(data.hip));
      setShoulderWidth(
        toInputValue(data.shoulder_width)
      );

      const savedStyles = data.style_preferences
        ? data.style_preferences
          .split(",")
          .map((style) => style.trim())
          .filter(Boolean)
        : [];

      setStyles(savedStyles);
    } catch (error) {
      console.error("Load profile error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const toggleStyle = (style: string) => {
    setStyles((prev) =>
      prev.includes(style)
        ? prev.filter((s) => s !== style)
        : [...prev, style]
    );
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      setUploadingAvatar(true);

      const token = await getToken();

      if (!token) {
        throw new Error("Please log in again.");
      }

      const uriParts = imageUri.split(".");

      let extension =
        uriParts[uriParts.length - 1]
          ?.toLowerCase()
          .split("?")[0] || "jpg";

      if (
        extension !== "jpg" &&
        extension !== "jpeg" &&
        extension !== "png" &&
        extension !== "webp"
      ) {
        extension = "jpg";
      }

      let mimeType = "image/jpeg";

      if (extension === "png") {
        mimeType = "image/png";
      } else if (extension === "webp") {
        mimeType = "image/webp";
      }

      const formData = new FormData();

      formData.append(
        "image",
        {
          uri: imageUri,
          name: `avatar-${Date.now()}.${extension}`,
          type: mimeType,
        } as any
      );

      const response = await fetch(
        `${API_URL}/api/upload/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Failed to upload avatar."
        );
      }

      const imageUrl =
        data.avatar_image ||
        data.image_url ||
        data.publicUrl ||
        data.public_url ||
        data.url;

      if (!imageUrl) {
        throw new Error(
          "Avatar uploaded but no image URL was returned."
        );
      }

      setAvatarImage(imageUrl);

      Alert.alert(
        "Avatar Updated",
        "Your profile photo has been updated."
      );
    } catch (error) {
      console.error("Avatar upload error:", error);

      Alert.alert(
        "Upload Error",
        error instanceof Error
          ? error.message
          : "Failed to upload avatar."
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const chooseAvatarFromLibrary = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Photo library permission is required."
      );

      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

    if (!result.canceled) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const takeAvatarPhoto = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Camera permission is required."
      );

      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const handleEditAvatar = () => {
    if (uploadingAvatar) {
      return;
    }

    Alert.alert(
      "Edit Avatar",
      "Choose a photo source",
      [
        {
          text: "Take Photo",
          onPress: takeAvatarPhoto,
        },
        {
          text: "Choose from Library",
          onPress: chooseAvatarFromLibrary,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      const token = await getToken();

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/api/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            height: toNumberOrNull(height),
            weight: toNumberOrNull(weight),
            chest: toNumberOrNull(chest),
            waist: toNumberOrNull(waist),
            hip: toNumberOrNull(hip),
            shoulder_width:
              toNumberOrNull(shoulderWidth),
            style_preferences:
              styles_.length > 0
                ? styles_.join(", ")
                : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Failed to save profile."
        );
      }

      Alert.alert(
        "Profile Saved",
        "Your profile has been updated.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Save profile error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to save profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#818CF8"
          />

          <Text style={styles.loadingText}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color="#374151"
            />
          </TouchableOpacity>

          <View>
            <Text style={styles.title}>
              Edit Profile
            </Text>

            <Text style={styles.subtitle}>
              Personalize your avatar and style preferences
            </Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        {/* Avatar preview */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {avatarImage ? (
              <Image
                source={{ uri: avatarImage }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarInner}>
                <Ionicons
                  name="person-outline"
                  size={38}
                  color="#FFFFFF"
                />
              </View>
            )}

            {uploadingAvatar && (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              </View>
            )}
          </View>

          <Text style={styles.avatarName}>
            {fullName}
          </Text>

          <TouchableOpacity
            style={[
              styles.editAvatarButton,
              uploadingAvatar &&
              styles.disabledButton,
            ]}
            onPress={handleEditAvatar}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Text style={styles.editAvatarText}>
                Edit Avatar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Customize Your Avatar */}
        <Text style={styles.sectionTitle}>
          Customize Your Avatar
        </Text>

        <Text style={styles.sectionSubtitle}>
          Fine-tune appearance and style details
        </Text>

        {/* Body measurements */}
        <View style={styles.block}>
          <View style={styles.rowBetween}>
            <Text style={styles.fieldLabel}>
              Body Measurements
            </Text>

            <Text style={styles.fieldHint}>
              Approximate fit
            </Text>
          </View>

          <View style={styles.measurementRow}>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>
                Height
              </Text>

              <TextInput
                value={height}
                onChangeText={setHeight}
                placeholder="e.g. 178"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>
                Weight
              </Text>

              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g. 75"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.measurementRow}>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>
                Chest
              </Text>

              <TextInput
                value={chest}
                onChangeText={setChest}
                placeholder="e.g. 96"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>
                Waist
              </Text>

              <TextInput
                value={waist}
                onChangeText={setWaist}
                placeholder="e.g. 81"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.measurementRow}>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>
                Hip
              </Text>

              <TextInput
                value={hip}
                onChangeText={setHip}
                placeholder="e.g. 101"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>
                Shoulder Width
              </Text>

              <TextInput
                value={shoulderWidth}
                onChangeText={setShoulderWidth}
                placeholder="e.g. 46"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
          </View>
        </View>

        {/* Style preferences */}
        <View style={styles.block}>
          <View style={styles.rowBetween}>
            <Text style={styles.fieldLabel}>
              Style Preferences
            </Text>

            <Text style={styles.fieldHint}>
              Choose your vibe
            </Text>
          </View>

          <View style={styles.pillRow}>
            {STYLE_VIBES.map((style) => (
              <TouchableOpacity
                key={style}
                onPress={() => toggleStyle(style)}
                style={[
                  styles.pill,
                  styles_.includes(style) &&
                  styles.pillActive,
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    styles_.includes(style) &&
                    styles.pillTextActive,
                  ]}
                >
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            saving && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Save Profile
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 16,
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
    maxWidth: 200,
    textAlign: "center",
  },

  avatarSection: {
    alignItems: "center",
    marginTop: 16,
  },

  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#818CF8",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    resizeMode: "cover",
  },

  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarName: {
    marginTop: 12,
    fontWeight: "600",
    fontSize: 16,
    color: "#111827",
  },

  editAvatarButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#111827",
    borderRadius: 999,
    minWidth: 100,
    alignItems: "center",
  },

  editAvatarText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    marginBottom: 20,
  },

  block: {
    marginBottom: 24,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  fieldHint: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  measurementRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  measurementInput: {
    flex: 1,
  },

  inputLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },

  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },

  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },

  pillActive: {
    backgroundColor: "#111827",
  },

  pillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4B5563",
  },

  pillTextActive: {
    color: "#FFFFFF",
  },

  primaryButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.6,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#9CA3AF",
    fontSize: 14,
  },
});