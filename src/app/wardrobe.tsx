import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomTabBar from "../../src/app/BottomTabBar";

const API_URL = "http://127.0.0.1:3000";

const FILTER_CATEGORIES = [
  "All",
  "Tops",
  "Bottoms",
  "Dresses",
  "Shoes",
  "Accessories",
];

const ITEM_CATEGORIES = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Shoes",
  "Accessories",
];

const SEASONS = ["Spring", "Summer", "Fall", "Winter"];

type WardrobeItem = {
  item_id: number;
  user_id: number;
  item_name: string;
  category: string | null;
  sub_category: string | null;
  brand: string | null;
  color: string | null;
  pattern: string | null;
  material: string | null;
  season: string | null;
  image_url: string | null;
  source_type: string | null;
  shopping_url: string | null;
  price: number | null;
  favorite: boolean | null;
};

export default function WardrobeScreen() {
  const router = useRouter();

  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);

  const [itemName, setItemName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [pattern, setPattern] = useState("");
  const [material, setMaterial] = useState("");
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const getToken = async () => {
    return await SecureStore.getItemAsync("authToken");
  };

  const loadWardrobe = useCallback(async () => {
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert(
          "Login required",
          "Please log in again to view your wardrobe."
        );
        return;
      }

      const response = await fetch(`${API_URL}/api/wardrobe`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Failed to load wardrobe."
        );
      }

      setWardrobeItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load wardrobe error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to load wardrobe."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWardrobe();
    }, [loadWardrobe])
  );

  const resetForm = () => {
    setItemName("");
    setSelectedCategory(null);
    setPickedImage(null);
    setBrand("");
    setColor("");
    setPattern("");
    setMaterial("");
    setSelectedSeasons([]);
  };

  const toggleSeason = (season: string) => {
    setSelectedSeasons((prev) =>
      prev.includes(season)
        ? prev.filter((s) => s !== season)
        : [...prev, season]
    );
  };

  const handleTakePhoto = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Camera permission is required to take a photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
    }
  };

  const handleChooseFromLibrary = async () => {
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
        quality: 0.7,
      });

    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
    }
  };

  const handlePickImage = () => {
    Alert.alert("Add Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: handleTakePhoto,
      },
      {
        text: "Choose from Library",
        onPress: handleChooseFromLibrary,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const uploadWardrobeImage = async (
    imageUri: string
  ) => {
    const token = await getToken();

    if (!token) {
      throw new Error("Please log in again.");
    }

    const uriParts = imageUri.split(".");
    const extension =
      uriParts[uriParts.length - 1]
        ?.toLowerCase()
        .split("?")[0] || "jpg";

    let mimeType = "image/jpeg";

    if (extension === "png") {
      mimeType = "image/png";
    } else if (extension === "webp") {
      mimeType = "image/webp";
    }

    const fileName = `wardrobe-${Date.now()}.${extension}`;

    const formData = new FormData();

    formData.append(
      "image",
      {
        uri: imageUri,
        name: fileName,
        type: mimeType,
      } as any
    );

    const response = await fetch(
      `${API_URL}/api/upload/wardrobe`,
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
        "Failed to upload image."
      );
    }

    const imageUrl =
      data.image_url ||
      data.publicUrl ||
      data.public_url ||
      data.url;

    if (!imageUrl) {
      throw new Error(
        "Image uploaded but no image URL was returned."
      );
    }

    return imageUrl;
  };

  const handleAddItem = async () => {
    if (
      !pickedImage ||
      !selectedCategory ||
      submitting
    ) {
      return;
    }

    try {
      setSubmitting(true);

      const token = await getToken();

      if (!token) {
        throw new Error("Please log in again.");
      }

      const imageUrl =
        await uploadWardrobeImage(pickedImage);

      const response = await fetch(
        `${API_URL}/api/wardrobe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            item_name:
              itemName.trim() || "Untitled item",
            category: selectedCategory,
            sub_category: null,
            brand: brand.trim() || null,
            color: color.trim() || null,
            pattern: pattern.trim() || null,
            material: material.trim() || null,
            season:
              selectedSeasons.length > 0
                ? selectedSeasons.join(", ")
                : null,
            image_url: imageUrl,
            source_type: "Upload",
            shopping_url: null,
            price: null,
            favorite: false,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Failed to add wardrobe item."
        );
      }

      resetForm();
      setModalVisible(false);

      await loadWardrobe();
    } catch (error) {
      console.error("Add wardrobe item error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to add wardrobe item."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    !!pickedImage &&
    !!selectedCategory &&
    !submitting;

  const filteredClothes =
    activeFilter === "All"
      ? wardrobeItems
      : wardrobeItems.filter(
        (item) => item.category === activeFilter
      );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#222"
          />
        </TouchableOpacity>

        <Text style={styles.title}>Wardrobe</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {FILTER_CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setActiveFilter(item)}
            style={[
              styles.category,
              activeFilter === item &&
              styles.activeCategory,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                activeFilter === item &&
                styles.activeText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#F48FB1"
            />
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredClothes.length === 0 && (
              <Text style={styles.emptyText}>
                {activeFilter === "All"
                  ? "Your wardrobe is empty. Tap + to add your first item."
                  : `No ${activeFilter.toLowerCase()} yet.`}
              </Text>
            )}

            {filteredClothes.map((item) => (
              <TouchableOpacity
                key={item.item_id}
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/wardrobe_details",
                    params: { id: String(item.item_id) },
                  })
                }
              >
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.clothImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.clothImage,
                      styles.imagePlaceholder,
                    ]}
                  >
                    <Ionicons
                      name="shirt-outline"
                      size={45}
                      color="#C8C8C8"
                    />
                  </View>
                )}

                <Text style={styles.name}>
                  {item.item_name}
                </Text>

                <Text style={styles.type}>
                  {item.category || "Uncategorized"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomTabBar active="upload" />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalCard}
            contentContainerStyle={{
              paddingBottom: 40,
            }}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                Add to Wardrobe
              </Text>

              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.photoPicker}
              onPress={handlePickImage}
            >
              {pickedImage ? (
                <Image
                  source={{ uri: pickedImage }}
                  style={styles.photoPreview}
                />
              ) : (
                <>
                  <Ionicons
                    name="camera-outline"
                    size={22}
                    color="#9CA3AF"
                  />
                  <Text style={styles.photoPickerText}>
                    Add Photo
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>
              Item name (optional)
            </Text>

            <TextInput
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g.White Oversized Shirt"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              Category
            </Text>

            <View style={styles.chipRow}>
              {ITEM_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() =>
                    setSelectedCategory(cat)
                  }
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat &&
                    styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat &&
                      styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>
              Brand (optional)
            </Text>

            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. Levi's"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              Color (optional)
            </Text>

            <TextInput
              value={color}
              onChangeText={setColor}
              placeholder="e.g. Navy Blue"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              Pattern (optional)
            </Text>

            <TextInput
              value={pattern}
              onChangeText={setPattern}
              placeholder="e.g.Striped, Solid, Floral"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              Material (optional)
            </Text>

            <TextInput
              value={material}
              onChangeText={setMaterial}
              placeholder="e.g.Cotton"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              Seasons (optional)
            </Text>

            <View style={styles.chipRow}>
              {SEASONS.map((season) => (
                <TouchableOpacity
                  key={season}
                  onPress={() =>
                    toggleSeason(season)
                  }
                  style={[
                    styles.categoryChip,
                    selectedSeasons.includes(
                      season
                    ) &&
                    styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedSeasons.includes(
                        season
                      ) &&
                      styles.categoryChipTextActive,
                    ]}
                  >
                    {season}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                !canSubmit &&
                styles.submitButtonDisabled,
              ]}
              onPress={handleAddItem}
              disabled={!canSubmit}
            >
              {submitting ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={styles.submitButtonText}
                >
                  Add Item
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8FA",
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
  },

  addButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#F48FB1",
    justifyContent: "center",
    alignItems: "center",
  },

  addText: {
    color: "#fff",
    fontSize: 30,
    marginTop: -3,
  },

  topTabRow: {
    flexDirection: "row",
    marginTop: 20,
    backgroundColor: "#F3E8EC",
    borderRadius: 14,
    padding: 4,
  },

  topTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  topTabActive: {
    backgroundColor: "#fff",
  },

  topTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },

  topTabTextActive: {
    color: "#222",
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 8,
  },

  category: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignSelf: "flex-start",
  },

  activeCategory: {
    backgroundColor: "#F48FB1",
  },

  categoryText: {
    color: "#777",
    fontSize: 13,
  },

  activeText: {
    color: "#fff",
  },

  emptyText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
    width: "100%",
  },

  loadingContainer: {
    paddingTop: 80,
    alignItems: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 25,
  },

  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
  },

  clothImage: {
    width: "100%",
    height: 170,
    borderRadius: 15,
    resizeMode: "cover",
  },

  imagePlaceholder: {
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },

  type: {
    color: "#999",
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },

  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  photoPicker: {
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    gap: 4,
    overflow: "hidden",
  },

  photoPickerText: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  photoPreview: {
    width: "100%",
    height: "100%",
  },

  inputLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    marginTop: 12,
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

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },

  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },

  categoryChipActive: {
    backgroundColor: "#F48FB1",
  },

  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4B5563",
  },

  categoryChipTextActive: {
    color: "#FFFFFF",
  },

  submitButton: {
    marginTop: 24,
    backgroundColor: "#F48FB1",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },

  submitButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});