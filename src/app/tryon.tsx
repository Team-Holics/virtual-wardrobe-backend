import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppData } from "../../src/context/AppDataContext";

const CATEGORIES = ["Tops", "Bottoms", "Dresses", "Shoes", "Accessories"];

// Mock AI analysis — replace with a real sizing/CV API call once the backend is ready
const FIT_DATA = {
  confidence: 87,
  recommendedSize: "M",
  notes: ["Fits well around shoulders", "Slightly relaxed at waist"],
};

export default function TryOnScreen() {
  const router = useRouter();
  const { addToWardrobe, addToWishlist } = useAppData();

  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
    const [rating, setRating] = useState(0); // 0 = not rated yet, 1–5 stars
  const [confirmation, setConfirmation] = useState<string | null>(null);

      const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
      setRating(0);
      setConfirmation(null);
    }
  };

    const handleChooseFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
      setRating(0);
      setConfirmation(null);
    }
  };

  const handlePickImage = () => {
    Alert.alert("Add Photo", "Choose an option", [
      { text: "Take Photo", onPress: handleTakePhoto },
      { text: "Choose from Library", onPress: handleChooseFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleAddToWardrobe = () => {
    if (!pickedImage || !category) return;
    addToWardrobe({
      name: itemName.trim() || "Untitled item",
      type: category,
      image: { uri: pickedImage },
    });
    setConfirmation("Added to your wardrobe!");
  };

  const handleAddToWishlist = () => {
    if (!pickedImage) return;
    addToWishlist({
      name: itemName.trim() || "Untitled item",
      brand: "",
      source: "",
      price: "",
      imageUri: pickedImage,
    });
    setConfirmation("Added to your wishlist!");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Virtual Try-On</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="share-outline" size={16} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
      {/* Upload square */}
      <TouchableOpacity style={styles.stage} onPress={handlePickImage}>
        {pickedImage ? (
          <Image source={{ uri: pickedImage }} style={styles.stageImage} />
        ) : (
          <View style={styles.stagePlaceholder}>
            <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
            <Text style={styles.stagePlaceholderText}>Tap to upload a photo</Text>
          </View>
        )}
      </TouchableOpacity>

      {pickedImage && (
        <>
          {/* AI Fit Analysis */}
          <View style={styles.fitSection}>
            <Text style={styles.fitLabel}>AI Fit Analysis</Text>
            <View style={styles.fitRow}>
              <Text style={styles.fitConfidence}>Fit Confidence: {FIT_DATA.confidence}%</Text>
              <View style={styles.sizeBadge}>
                <Text style={styles.sizeBadgeText}>
                  Recommended Size: <Text style={{ fontWeight: "700" }}>{FIT_DATA.recommendedSize}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${FIT_DATA.confidence}%` }]} />
            </View>

            {FIT_DATA.notes.map((note) => (
              <Text key={note} style={styles.fitNote}>
                • {note}
              </Text>
            ))}
          </View>

                    {/* Satisfaction rating */}
          <View style={styles.satisfactionSection}>
            <Text style={styles.satisfactionLabel}>Are you satisfied with this look?</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={30}
                    color={star <= rating ? "#F59E0B" : "#D1D5DB"}
                    style={{ marginBottom: 6 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && rating <= 2 && (
              <Text style={styles.satisfactionFollowup}>
                Try a different photo or check the AI Stylist for other suggestions.
              </Text>
            )}
          </View>

          {/* Item name */}
          <Text style={styles.inputLabel}>Item name (optional)</Text>
          <TextInput
            value={itemName}
            onChangeText={setItemName}
            placeholder="e.g. White Oversized Shirt"
            style={styles.input}
          />

          {/* Category — only required for Wardrobe */}
          <Text style={styles.inputLabel}>Category (needed for Wardrobe)</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {confirmation && <Text style={styles.confirmationText}>{confirmation}</Text>}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, !category && styles.buttonDisabled]}
              onPress={handleAddToWardrobe}
              disabled={!category}
            >
              <Text style={styles.primaryButtonText}>Add to Wardrobe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleAddToWishlist}>
              <Text style={styles.secondaryButtonText}>Add to Wishlist</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  stage: {
    marginTop: 12,
    aspectRatio: 4 / 5,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    overflow: "hidden",
  },
  stageImage: { width: "100%", height: "100%" },
  stagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  stagePlaceholderText: { fontSize: 13, color: "#9CA3AF" },

  fitSection: { marginTop: 20 },
  fitLabel: { fontSize: 11, color: "#9CA3AF" },
  fitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 4,
  },
  fitConfidence: { fontSize: 16, fontWeight: "700", color: "#111827" },
  sizeBadge: { backgroundColor: "#F3F4F6", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  sizeBadgeText: { fontSize: 11, color: "#4B5563" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#111827" },
  fitNote: { fontSize: 12, color: "#6B7280", marginTop: 6 },

  satisfactionSection: { marginTop: 20 },
  satisfactionLabel: { fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 8 },
  satisfactionRow: { flexDirection: "row", gap: 8 },
  satisfactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  satisfactionButtonActiveYes: { backgroundColor: "#16A34A" },
  satisfactionButtonActiveNo: { backgroundColor: "#DC2626" },
  satisfactionText: { fontSize: 13, fontWeight: "500", color: "#374151" },
  satisfactionTextActive: { color: "#FFFFFF" },
  satisfactionFollowup: { fontSize: 12, color: "#9CA3AF", marginTop: 8 },

  inputLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },

  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  categoryChipActive: { backgroundColor: "#111827" },
  categoryChipText: { fontSize: 13, fontWeight: "500", color: "#4B5563" },
  categoryChipTextActive: { color: "#FFFFFF" },

  confirmationText: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: "600",
    color: "#16A34A",
    textAlign: "center",
  },

  actions: { marginTop: 20, marginBottom: 24, gap: 8 },
  primaryButton: { paddingVertical: 16, borderRadius: 14, backgroundColor: "#111827", alignItems: "center" },
  buttonDisabled: { backgroundColor: "#D1D5DB" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  secondaryButtonText: { color: "#111827", fontSize: 15, fontWeight: "700" },
  starRow: { flexDirection: "row" },
});

