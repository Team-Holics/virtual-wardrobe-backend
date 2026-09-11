import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://127.0.0.1:3000";

type SavedOutfit = {
  saved_outfit_id: number;
  user_id: number;
  recommendation_id: string;
  outfit_name: string;
  image_key: string | null;
  created_at: string;
};

const IMAGE_MAP: Record<string, any> = {
  shirt1: require("../../assets/images/shirt1.jpg"),
  shirt2: require("../../assets/images/shirt2.jpg"),
  shirt3: require("../../assets/images/shirt3.jpg"),
  look1: require("../../assets/images/look1.jpg"),
  look2: require("../../assets/images/look2.jpg"),
  look3: require("../../assets/images/look3.jpg"),
  look4: require("../../assets/images/look4.jpg"),
  shoe1: require("../../assets/images/shoe1.jpg"),
};

export default function SavedOutfitsScreen() {
  const router = useRouter();

  const [outfitItems, setOutfitItems] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedOutfits = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_URL}/api/saved-outfits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      let data: any;

      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load saved outfits"
        );
      }

      setOutfitItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Saved outfits load error:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadSavedOutfits();
    }, [loadSavedOutfits])
  );

  const removeSavedOutfit = async (
    recommendationId: string
  ) => {
    try {
      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/saved-outfits/${recommendationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to remove saved outfit"
        );
      }

      setOutfitItems((prev) =>
        prev.filter(
          (item) =>
            item.recommendation_id !== recommendationId
        )
      );
    } catch (error) {
      console.error("Remove saved outfit error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color="#374151"
          />
        </TouchableOpacity>

        <Text style={styles.title}>Saved Outfits</Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.grid}>
          {!loading && outfitItems.length === 0 && (
            <Text style={styles.emptyText}>
              No outfits saved yet. Bookmark outfits you like from
              Home to see them here.
            </Text>
          )}

          {outfitItems.map((item) => (
            <View
              key={item.saved_outfit_id}
              style={styles.card}
            >
              <Image
                source={
                  item.image_key && IMAGE_MAP[item.image_key]
                    ? IMAGE_MAP[item.image_key]
                    : require("../../assets/images/look1.jpg")
                }
                style={styles.image}
              />

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() =>
                  removeSavedOutfit(item.recommendation_id)
                }
              >
                <Ionicons
                  name="bookmark"
                  size={16}
                  color="#111827"
                />
              </TouchableOpacity>

              <Text style={styles.name}>
                {item.outfit_name}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 60,
    width: "100%",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
  },

  card: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  image: {
    width: "100%",
    height: 170,
    borderRadius: 15,
    resizeMode: "cover",
  },

  removeButton: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  name: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
});