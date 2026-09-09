import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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

const API_URL = "http://127.0.0.1:3000";

type WishlistItem = {
  wishlist_id: number;
  user_id: number;
  item_name: string;
  brand: string | null;
  source: string | null;
  price: string | number | null;
  image_url: string | null;
  created_at: string;
};

function WishlistCard({
  item,
  onDelete,
}: {
  item: WishlistItem;
  onDelete: (id: number) => void;
}) {
  const displayPrice =
    item.price !== null &&
      item.price !== undefined &&
      String(item.price).trim() !== ""
      ? `฿${Number(item.price).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`
      : "";

  const brandSource = [item.brand, item.source ? `Source: ${item.source}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.card}>
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.thumbnail} />
      )}

      <View style={{ flex: 1 }}>
        <View style={styles.cardTopRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.item_name}
          </Text>

          {displayPrice ? (
            <Text style={styles.itemPrice}>{displayPrice}</Text>
          ) : null}
        </View>

        {brandSource ? (
          <Text style={styles.itemSource}>{brandSource}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={() => onDelete(item.wishlist_id)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

export default function WishlistScreen() {
  const router = useRouter();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [source, setSource] = useState("");
  const [price, setPrice] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  // =====================================================
  // LOAD WISHLIST
  // =====================================================

  const loadWishlist = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_URL}/api/wishlist`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("authToken");
        await SecureStore.deleteItemAsync("user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to load wishlist");
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Wishlist load error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to load wishlist."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadWishlist();
    }, [loadWishlist])
  );

  // =====================================================
  // IMAGE PICKER
  // =====================================================

  const handleTakePhoto = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take a photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleChooseFromLibrary = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Photo library permission is required to choose an image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
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

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setName("");
    setBrand("");
    setSource("");
    setPrice("");
    setImageUri(null);
  };

  const closeModal = () => {
    if (adding) {
      return;
    }

    resetForm();
    setModalVisible(false);
  };

  // =====================================================
  // UPLOAD IMAGE TO SUPABASE THROUGH BACKEND
  // =====================================================

  const uploadWishlistImage = async (
    token: string,
    uri: string
  ): Promise<string> => {
    const formData = new FormData();

    const cleanUri = uri.split("?")[0];
    const fileName =
      cleanUri.split("/").pop() || `wishlist-${Date.now()}.jpg`;

    let extension = fileName
      .split(".")
      .pop()
      ?.toLowerCase();

    if (
      extension !== "jpg" &&
      extension !== "jpeg" &&
      extension !== "png" &&
      extension !== "webp"
    ) {
      extension = "jpg";
    }

    const mimeType =
      extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : "image/jpeg";

    formData.append(
      "image",
      {
        uri,
        name: `wishlist-${Date.now()}.${extension}`,
        type: mimeType,
      } as any
    );

    const response = await fetch(
      `${API_URL}/api/upload/wishlist`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const responseText = await response.text();

    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "Wishlist upload returned non-JSON response:",
        response.status,
        responseText
      );

      throw new Error(
        `Image upload failed (${response.status}). Check the backend Terminal.`
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.details ||
        "Failed to upload wishlist image"
      );
    }

    if (!data.image_url) {
      throw new Error(
        "Wishlist image URL was not returned by the server"
      );
    }

    return data.image_url;
  };

  // =====================================================
  // ADD WISHLIST ITEM
  // =====================================================

  const handleAddItem = async () => {
    if (!name.trim()) {
      Alert.alert(
        "Item Name Required",
        "Please enter an item name."
      );
      return;
    }

    if (price.trim()) {
      const numericPrice = Number(price);

      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        Alert.alert(
          "Invalid Price",
          "Please enter a valid non-negative price."
        );
        return;
      }
    }

    try {
      setAdding(true);

      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      let imageUrl: string | null = null;

      if (imageUri) {
        imageUrl = await uploadWishlistImage(
          token,
          imageUri
        );
      }

      const response = await fetch(
        `${API_URL}/api/wishlist`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            item_name: name.trim(),
            brand: brand.trim(),
            source: source.trim(),
            price: price.trim() || null,
            image_url: imageUrl,
          }),
        }
      );

      const responseText = await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error(
          "Add wishlist returned non-JSON response:",
          response.status,
          responseText
        );

        throw new Error(
          `Wishlist request failed (${response.status}). Check the backend Terminal.`
        );
      }
      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("authToken");
        await SecureStore.deleteItemAsync("user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add wishlist item"
        );
      }

      if (data.wishlist) {
        setItems((previousItems) => [
          data.wishlist,
          ...previousItems,
        ]);
      } else {
        await loadWishlist();
      }

      resetForm();
      setModalVisible(false);
    } catch (error) {
      console.error("Add wishlist error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to add wishlist item."
      );
    } finally {
      setAdding(false);
    }
  };

  // =====================================================
  // DELETE WISHLIST ITEM
  // =====================================================

  const deleteWishlistItem = async (wishlistId: number) => {
    try {
      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/wishlist/${wishlistId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("authToken");
        await SecureStore.deleteItemAsync("user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete wishlist item"
        );
      }

      setItems((previousItems) =>
        previousItems.filter(
          (item) => item.wishlist_id !== wishlistId
        )
      );
    } catch (error) {
      console.error("Delete wishlist error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to delete wishlist item."
      );
    }
  };

  const handleDelete = (wishlistId: number) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to remove this item from your wishlist?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteWishlistItem(wishlistId),
        },
      ]
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={22}
              color="#111827"
            />
          </TouchableOpacity>

          <View style={styles.headerTitleRow}>
            <Ionicons
              name="heart"
              size={18}
              color="#111827"
            />
            <Text style={styles.title}>
              My Wishlist
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons
              name="add"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>
              Loading wishlist...
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) =>
              String(item.wishlist_id)
            }
            renderItem={({ item }) => (
              <WishlistCard
                item={item}
                onDelete={handleDelete}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View style={{ height: 12 }} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="heart-outline"
                  size={32}
                  color="#D1D5DB"
                />
                <Text style={styles.emptyText}>
                  Your wishlist is empty.
                </Text>
                <Text style={styles.emptySubtext}>
                  Tap + to add your first item.
                </Text>
              </View>
            }
          />
        )}
      </View>

      <BottomTabBar active="upload" />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                Wishlist
              </Text>

              <TouchableOpacity
                onPress={closeModal}
                disabled={adding}
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
              disabled={adding}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
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
              Item name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Tailored Black Blazer"
              style={styles.input}
              editable={!adding}
            />

            <Text style={styles.inputLabel}>
              Brand
            </Text>
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. COS"
              style={styles.input}
              editable={!adding}
            />

            <Text style={styles.inputLabel}>
              Source
            </Text>
            <TextInput
              value={source}
              onChangeText={setSource}
              placeholder="e.g. Zara"
              style={styles.input}
              editable={!adding}
            />

            <Text style={styles.inputLabel}>
              Price
            </Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="e.g. 99.99"
              keyboardType="decimal-pad"
              style={styles.input}
              editable={!adding}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                adding && styles.submitButtonDisabled,
              ]}
              onPress={handleAddItem}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Add Item
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 24,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexGrow: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
    color: "#9CA3AF",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 6,
  },

  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },

  emptySubtext: {
    fontSize: 12,
    color: "#D1D5DB",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 14,
  },

  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  itemSource: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },

  deleteButton: {
    padding: 6,
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
    paddingBottom: 40,
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
    color: "#111827",
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
    overflow: "hidden",
  },

  photoPickerText: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  photoPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
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