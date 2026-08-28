import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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
import { useAppData } from "../../src/context/AppDataContext";

const TOP_TABS = ["Clothes", "Outfit"] as const;
type TopTab = (typeof TOP_TABS)[number];

const FILTER_CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Shoes", "Accessories"];
const ITEM_CATEGORIES = ["Tops", "Bottoms", "Dresses", "Shoes", "Accessories"];
const SEASONS = ["Spring", "Summer", "Fall", "Winter"];

export default function WardrobeScreen() {
  const router = useRouter();
  const { wardrobeItems, addToWardrobe, outfitItems } = useAppData();

  const [topTab, setTopTab] = useState<TopTab>("Clothes");
  const [activeFilter, setActiveFilter] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);

  const [itemName, setItemName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [pattern, setPattern] = useState("");
  const [material, setMaterial] = useState("");
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);

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
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]
    );
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
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
    }
  };

  const handlePickImage = () => {
    Alert.alert("Add Photo", "Choose an option", [
      { text: "Take Photo", onPress: handleTakePhoto },
      { text: "Choose from Library", onPress: handleChooseFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleAddItem = () => {
    if (!pickedImage || !selectedCategory) return;
    addToWardrobe({
      name: itemName.trim() || "Untitled item",
      type: selectedCategory,
      image: { uri: pickedImage },
      brand: brand.trim(),
      color: color.trim(),
      pattern: pattern.trim(),
      material: material.trim(),
      seasons: selectedSeasons,
    });
    resetForm();
    setModalVisible(false);
  };

  const canSubmit = !!pickedImage && !!selectedCategory;

  const filteredClothes =
    activeFilter === "All"
      ? wardrobeItems
      : wardrobeItems.filter((item) => item.type === activeFilter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.title}>My Wardrobe</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Top-level tabs: Clothes / Outfit */}
      <View style={styles.topTabRow}>
        {TOP_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setTopTab(tab)}
            style={[styles.topTab, topTab === tab && styles.topTabActive]}
          >
            <Text style={[styles.topTabText, topTab === tab && styles.topTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {topTab === "Clothes" ? (
        <>
          {/* Category filter — fixed to content size, functional */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {FILTER_CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setActiveFilter(item)}
                style={[styles.category, activeFilter === item && styles.activeCategory]}
              >
                <Text style={[styles.categoryText, activeFilter === item && styles.activeText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView showsVerticalScrollIndicator={false}>
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
                  key={item.id}
                  style={styles.card}
                  onPress={() => router.push(`/wardrobe-detail?id=${item.id}`)}
                >
                  <Image source={item.image} style={styles.clothImage} />
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.type}>{item.type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {outfitItems.length === 0 && (
              <Text style={styles.emptyText}>
                No outfits saved yet. Outfits you like from Home will show up here.
              </Text>
            )}

            {outfitItems.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image source={item.image} style={styles.clothImage} />
                <Text style={styles.name}>{item.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <BottomTabBar active="upload" />

      {/* Add item modal — only for Clothes */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalCard} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add to Wardrobe</Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.photoPicker} onPress={handlePickImage}>
              {pickedImage ? (
                <Image source={{ uri: pickedImage }} style={styles.photoPreview} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={22} color="#9CA3AF" />
                  <Text style={styles.photoPickerText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Item name (optional)</Text>
            <TextInput
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g. White Oversized Shirt"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.chipRow}>
              {ITEM_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Brand (optional)</Text>
            <TextInput value={brand} onChangeText={setBrand} placeholder="e.g. Levi's" style={styles.input} />

            <Text style={styles.inputLabel}>Color (optional)</Text>
            <TextInput value={color} onChangeText={setColor} placeholder="e.g. Navy Blue" style={styles.input} />

            <Text style={styles.inputLabel}>Pattern (optional)</Text>
            <TextInput
              value={pattern}
              onChangeText={setPattern}
              placeholder="e.g. Striped, Solid, Floral"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Material (optional)</Text>
            <TextInput
              value={material}
              onChangeText={setMaterial}
              placeholder="e.g. Cotton"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Seasons (optional)</Text>
            <View style={styles.chipRow}>
              {SEASONS.map((season) => (
                <TouchableOpacity
                  key={season}
                  onPress={() => toggleSeason(season)}
                  style={[
                    styles.categoryChip,
                    selectedSeasons.includes(season) && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedSeasons.includes(season) && styles.categoryChipTextActive,
                    ]}
                  >
                    {season}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleAddItem}
              disabled={!canSubmit}
            >
              <Text style={styles.submitButtonText}>Add Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8FA", paddingHorizontal: 20, paddingTop: 50 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "700", color: "#222" },
  addButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#F48FB1",
    justifyContent: "center",
    alignItems: "center",
  },
  addText: { color: "#fff", fontSize: 30, marginTop: -3 },

  topTabRow: {
    flexDirection: "row",
    marginTop: 20,
    backgroundColor: "#F3E8EC",
    borderRadius: 14,
    padding: 4,
  },
  topTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  topTabActive: { backgroundColor: "#fff" },
  topTabText: { fontSize: 14, fontWeight: "600", color: "#999" },
  topTabTextActive: { color: "#222" },

  // Fixed-size chip row — content-sized, not stretched
  categoryRow: { flexDirection: "row", alignItems: "center", marginTop: 18, gap: 8 },
  category: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  activeCategory: { backgroundColor: "#F48FB1" },
  categoryText: { color: "#777", fontSize: 13 },
  activeText: { color: "#fff" },

  emptyText: { color: "#999", fontSize: 14, textAlign: "center", marginTop: 40, width: "100%" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 25 },
  card: { width: "47%", backgroundColor: "#fff", borderRadius: 20, padding: 12, marginBottom: 20 },
  clothImage: { width: "100%", height: 170, borderRadius: 15, resizeMode: "cover" },
  name: { fontSize: 16, fontWeight: "600", marginTop: 10 },
  type: { color: "#999", marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
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
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#222" },
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
  photoPickerText: { fontSize: 12, color: "#9CA3AF" },
  photoPreview: { width: "100%", height: "100%" },
  inputLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F3F4F6" },
  categoryChipActive: { backgroundColor: "#F48FB1" },
  categoryChipText: { fontSize: 13, fontWeight: "500", color: "#4B5563" },
  categoryChipTextActive: { color: "#FFFFFF" },
  submitButton: { marginTop: 24, backgroundColor: "#F48FB1", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  submitButtonDisabled: { backgroundColor: "#D1D5DB" },
  submitButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
