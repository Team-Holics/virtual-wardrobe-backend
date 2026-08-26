import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
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

const FILTER_CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Shoes", "Accessories"];
const ITEM_CATEGORIES = ["Tops", "Bottoms", "Dresses", "Shoes", "Accessories"];

export default function WardrobeScreen() {
  const { wardrobeItems, addToWardrobe } = useAppData();

  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<string | null>(null);

  const resetForm = () => {
    setItemName("");
    setSelectedCategory(null);
    setPickedImage(null);
  };

  const handlePickImage = async () => {
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

  const handleAddItem = () => {
    if (!pickedImage || !selectedCategory) return;
    addToWardrobe({
      name: itemName.trim() || "Untitled item",
      type: selectedCategory,
      image: { uri: pickedImage },
    });
    resetForm();
    setModalVisible(false);
  };

  const canSubmit = !!pickedImage && !!selectedCategory;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        {FILTER_CATEGORIES.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.category, index === 0 && styles.activeCategory]}
          >
            <Text style={[styles.categoryText, index === 0 && styles.activeText]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {wardrobeItems.length === 0 && (
            <Text style={styles.emptyText}>
              Your wardrobe is empty. Tap + to add your first item.
            </Text>
          )}

          {wardrobeItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card}>
              <Image source={item.image} style={styles.clothImage} />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.type}>{item.type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomTabBar active="upload" />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
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
            <View style={styles.categoryPickerRow}>
              {ITEM_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat && styles.categoryChipActive,
                  ]}
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

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleAddItem}
              disabled={!canSubmit}
            >
              <Text style={styles.submitButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
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
  categoryContainer: { marginTop: 25 },
  category: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 10,
  },
  activeCategory: { backgroundColor: "#F48FB1" },
  categoryText: { color: "#777", fontSize: 14 },
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
    paddingBottom: 40,
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
  categoryPickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F3F4F6" },
  categoryChipActive: { backgroundColor: "#F48FB1" },
  categoryChipText: { fontSize: 13, fontWeight: "500", color: "#4B5563" },
  categoryChipTextActive: { color: "#FFFFFF" },
  submitButton: { marginTop: 24, backgroundColor: "#F48FB1", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  submitButtonDisabled: { backgroundColor: "#D1D5DB" },
  submitButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
