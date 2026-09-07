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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppData } from "../../src/context/AppDataContext";

const WARDROBE_FILTERS = ["All", "Tops", "Bottoms", "Dresses", "Shoes", "Accessories"];

type Source = "saved" | "wishlist" | "wardrobe" | null;
type ItemSource = "upload" | "saved" | "wishlist" | "wardrobe" | null;

export default function TryOnScreen() {
  const router = useRouter();
  const { addToWishlist, toggleOutfitItem, isOutfitSaved, outfitItems, wishlistItems, wardrobeItems } =
    useAppData();

  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemSource, setItemSource] = useState<ItemSource>(null);
  const [addedToWishlist, setAddedToWishlist] = useState(false);

  const [activeSource, setActiveSource] = useState<Source>(null);
  const [wardrobeFilter, setWardrobeFilter] = useState("All");

  const resetDownstream = () => {
    setAddedToWishlist(false);
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
      setActiveSource(null);
      setItemSource("upload");
      resetDownstream();
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
      setActiveSource(null);
      setItemSource("upload");
      resetDownstream();
    }
  };

  const handleUploadPress = () => {
    Alert.alert("Upload Photo", "Choose an option", [
      { text: "Take Photo", onPress: handleTakePhoto },
      { text: "Choose from Library", onPress: handleChooseFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Switching sources just toggles which strip is showing below the avatar —
  // tapping the same icon again collapses it.
  const handleSourcePress = (source: Source) => {
    setActiveSource((prev) => (prev === source ? null : source));
  };

  // Selecting an item from any strip loads its photo onto the "stage" and
  // remembers where it came from, so the decision cards below can ask only
  // what's actually relevant (e.g. don't offer "Add to Wishlist" for
  // something already pulled from the Wardrobe — they clearly already own it).
  const handleSelectSavedItem = (item: { id: string; name: string; image: any }) => {
    setPickedImage(null); // local-asset images can't be shown via the uri-based stage preview
    setItemName(item.name);
    setItemSource("saved");
    resetDownstream();
  };

  const handleSelectWishlistItem = (item: { name: string; imageUri?: string; image?: any }) => {
    if (item.imageUri) setPickedImage(item.imageUri);
    setItemName(item.name);
    setItemSource("wishlist");
    resetDownstream();
  };

  const handleSelectWardrobeItem = (item: { name: string; type: string; image: any }) => {
    setItemName(item.name);
    setItemSource("wardrobe");
    resetDownstream();
  };

  const currentOutfitId = itemSource ? `tryon-${itemName || "untitled"}-${itemSource}` : null;
  const isSavedAsOutfit = currentOutfitId ? isOutfitSaved(currentOutfitId) : false;

  const handleToggleSaveOutfit = () => {
    if (!currentOutfitId) return;
    toggleOutfitItem({
      id: currentOutfitId,
      name: itemName.trim() || "Untitled look",
      image: pickedImage ? { uri: pickedImage } : require("../../assets/images/logo.png"),
    });
  };

  const handleAddToWishlist = () => {
    addToWishlist({
      name: itemName.trim() || "Untitled item",
      brand: "",
      source: "",
      price: "",
      imageUri: pickedImage ?? undefined,
    });
    setAddedToWishlist(true);
  };

  const filteredWardrobeItems =
    wardrobeFilter === "All"
      ? wardrobeItems
      : wardrobeItems.filter((item) => item.type === wardrobeFilter);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Virtual Try-On</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Avatar stage — full size, no placeholder box; real avatar render
            slots in here later. Source-switcher icons float over the top-right
            edge instead of taking up their own column. */}
        <View style={styles.stage}>
          {pickedImage && <Image source={{ uri: pickedImage }} style={styles.stageImage} />}

          <View style={styles.sourcePill}>
            <TouchableOpacity style={styles.sourceButton} onPress={handleUploadPress}>
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sourceButton, activeSource === "saved" && styles.sourceButtonActive]}
              onPress={() => handleSourcePress("saved")}
            >
              <Ionicons name="bookmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sourceButton, activeSource === "wishlist" && styles.sourceButtonActive]}
              onPress={() => handleSourcePress("wishlist")}
            >
              <Ionicons name="heart" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sourceButton, activeSource === "wardrobe" && styles.sourceButtonActive]}
              onPress={() => handleSourcePress("wardrobe")}
            >
              <Ionicons name="layers-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Saved strip */}
        {activeSource === "saved" && (
          <View style={styles.stripSection}>
            <Text style={styles.stripLabel}>Saved Outfits</Text>
            {outfitItems.length === 0 ? (
              <Text style={styles.stripEmptyText}>Nothing saved yet.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {outfitItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.stripCard}
                    onPress={() => handleSelectSavedItem(item)}
                  >
                    <Image source={item.image} style={styles.stripImage} />
                    <Text style={styles.stripName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Wishlist strip */}
        {activeSource === "wishlist" && (
          <View style={styles.stripSection}>
            <Text style={styles.stripLabel}>Wishlist</Text>
            {wishlistItems.length === 0 ? (
              <Text style={styles.stripEmptyText}>Your wishlist is empty.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {wishlistItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.stripCard}
                    onPress={() => handleSelectWishlistItem(item)}
                  >
                    {item.image ? (
                      <Image source={item.image} style={styles.stripImage} />
                    ) : item.imageUri ? (
                      <Image source={{ uri: item.imageUri }} style={styles.stripImage} />
                    ) : (
                      <View style={styles.stripImage} />
                    )}
                    <Text style={styles.stripName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Wardrobe strip — category filter first, since wardrobe has many categories */}
        {activeSource === "wardrobe" && (
          <View style={styles.stripSection}>
            <Text style={styles.stripLabel}>Wardrobe</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {WARDROBE_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setWardrobeFilter(f)}
                  style={[styles.filterChip, wardrobeFilter === f && styles.filterChipActive]}
                >
                  <Text
                    style={[styles.filterChipText, wardrobeFilter === f && styles.filterChipTextActive]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredWardrobeItems.length === 0 ? (
              <Text style={styles.stripEmptyText}>No items in this category yet.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filteredWardrobeItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.stripCard}
                    onPress={() => handleSelectWardrobeItem(item)}
                  >
                    <Image source={item.image} style={styles.stripImage} />
                    <Text style={styles.stripName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {itemSource && (
          <View style={styles.decisionRow}>
            <TouchableOpacity
              style={[styles.decisionButton, isSavedAsOutfit && styles.decisionButtonActive]}
              onPress={handleToggleSaveOutfit}
            >
              <Ionicons
                name={isSavedAsOutfit ? "bookmark" : "bookmark-outline"}
                size={22}
                color={isSavedAsOutfit ? "#FFFFFF" : "#374151"}
              />
              <Text style={[styles.decisionButtonLabel, isSavedAsOutfit && styles.decisionButtonLabelActive]}>
                {isSavedAsOutfit ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>

            {itemSource !== "wardrobe" && itemSource !== "wishlist" && (
              <TouchableOpacity
                style={[styles.decisionButton, addedToWishlist && styles.decisionButtonActive]}
                onPress={handleAddToWishlist}
                disabled={addedToWishlist}
              >
                <Ionicons
                  name={addedToWishlist ? "heart" : "heart-outline"}
                  size={22}
                  color={addedToWishlist ? "#FFFFFF" : "#374151"}
                />
                <Text
                  style={[styles.decisionButtonLabel, addedToWishlist && styles.decisionButtonLabelActive]}
                >
                  {addedToWishlist ? "Added" : "Wishlist"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
    height: 480,
    position: "relative",
  },
  stageImage: { width: "100%", height: "100%", borderRadius: 20 },

  sourcePill: {
    position: "absolute",
    top: 12,
    right: 0,
    backgroundColor: "rgba(17,24,39,0.85)",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 14,
  },
  sourceButton: { alignItems: "center", justifyContent: "center", padding: 6, borderRadius: 999 },
  sourceButtonActive: { backgroundColor: "rgba(255,255,255,0.25)" },

  stripSection: { marginTop: 16 },
  stripLabel: { fontSize: 13, fontWeight: "700", color: "#111827", marginBottom: 8 },
  stripEmptyText: { fontSize: 12, color: "#9CA3AF" },
  stripCard: { width: 100, marginRight: 12 },
  stripImage: { width: 100, height: 120, borderRadius: 14, backgroundColor: "#F3F4F6" },
  stripName: { fontSize: 11, fontWeight: "600", color: "#111827", marginTop: 4 },

  filterRow: { gap: 8, paddingBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: "#F3F4F6" },
  filterChipActive: { backgroundColor: "#111827" },
  filterChipText: { fontSize: 12, fontWeight: "500", color: "#4B5563" },
  filterChipTextActive: { color: "#FFFFFF" },

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
  starRow: { flexDirection: "row" },
  satisfactionFollowup: { fontSize: 12, color: "#9CA3AF", marginTop: 8 },

  decisionRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  decisionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  decisionButtonActive: { backgroundColor: "#16A34A", borderColor: "#16A34A" },
  decisionButtonLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  decisionButtonLabelActive: { color: "#FFFFFF" },

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
});
