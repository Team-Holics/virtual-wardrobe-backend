import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../../src/app/BottomTabBar";
import { WishlistItem } from "../../src/context/AppDataContext";

// Your existing wishlist items — replace these with real data later
const INITIAL_ITEMS: WishlistItem[] = [
  { id: "1", name: "Tailored Black Blazer", brand: "COS", source: "Zara", price: "128" },
  { id: "2", name: "Structured Leather Bag", brand: "Mansur Gavriel", source: "Nordstrom", price: "245" },
  { id: "3", name: "Minimal White Sneakers", brand: "Common Projects", source: "SSENSE", price: "390" },
  { id: "4", name: "Satin Midi Skirt", brand: "Reformation", source: "Revolve", price: "168" },
];

function WishlistCard({ item, onDelete }: { item: WishlistItem; onDelete: (id: string) => void }) {
  return (
    <View style={styles.card}>
                  {item.image ? (
        <Image source={item.image} style={styles.thumbnail} />
      ) : item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnail} />
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.cardTopRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemPrice}>${item.price}</Text>
        </View>
        <Text style={styles.itemSource}>
          {item.brand} · Source: {item.source}
        </Text>
      </View>
      <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

export default function WishlistScreen() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>(INITIAL_ITEMS);
  const [modalVisible, setModalVisible] = useState(false);

  // Form fields for the "add new item" modal
    // Form fields for the "add new item" modal
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [source, setSource] = useState("");
  const [price, setPrice] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

    const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
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
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePickImage = () => {
    Alert.alert("Add Photo", "Choose an option", [
      { text: "Take Photo", onPress: handleTakePhoto },
      { text: "Choose from Library", onPress: handleChooseFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };
    const resetForm = () => {
    setName("");
    setBrand("");
    setSource("");
    setPrice("");
    setImageUri(null);
  };

   const handleAddItem = () => {
    const newItem: WishlistItem = {
      id: Date.now().toString(),
      name: name.trim() || "Untitled item",
      brand: brand.trim(),
      source: source.trim(),
      price: price.trim(),
      imageUri: imageUri ?? undefined,
    };
    setItems((prev) => [newItem, ...prev]);
    resetForm();
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={{ flex: 1 }}>
                <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <Ionicons name="heart" size={18} color="#111827" />
            <Text style={styles.title}>My Wishlist</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <WishlistCard item={item} onDelete={handleDelete} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>Your wishlist is empty.</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first item.</Text>
            </View>
          }
        />
      </View>

      <BottomTabBar active="upload" />

      {/* Add item modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Wishlist</Text>
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
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photoPreview} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={22} color="#9CA3AF" />
                  <Text style={styles.photoPickerText}>Add Photo</Text>
                </>
              )}
          </TouchableOpacity>

            <Text style={styles.inputLabel}>Item name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Tailored Black Blazer"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Brand</Text>
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. COS"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Source</Text>
            <TextInput
              value={source}
              onChangeText={setSource}
              placeholder="e.g. Zara"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Price</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="e.g. 128"
              keyboardType="numeric"
              style={styles.input}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleAddItem}>
              <Text style={styles.submitButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 24,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: { paddingHorizontal: 24, paddingVertical: 16 },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 6 },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#9CA3AF" },
  emptySubtext: { fontSize: 12, color: "#D1D5DB" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 14,
  },
  thumbnail: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#F3F4F6" },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  itemName: { flex: 1, fontSize: 14, fontWeight: "600", color: "#111827" },
  itemPrice: { fontSize: 14, fontWeight: "700", color: "#111827" },
  itemSource: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  deleteButton: { padding: 6 },

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
    paddingBottom: 40,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

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

  submitButton: {
    marginTop: 24,
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
    photoPicker: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    gap: 4,
  },
  photoPickerText: { fontSize: 12, color: "#9CA3AF" },
  photoPreview: { width: "100%", height: "100%", borderRadius: 12 },
  submitButtonDisabled: { backgroundColor: "#D1D5DB" },
  submitButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
