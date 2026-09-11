import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../../src/app/BottomTabBar";
import { useAppData } from "../../src/context/AppDataContext";

const API_URL = "http://127.0.0.1:3000";

const OUTFIT_CATEGORIES = ["Casual", "Date", "Work", "Party"] as const;
type OutfitCategory = (typeof OUTFIT_CATEGORIES)[number];

type UserProfile = {
  user_id?: number;
  full_name?: string;
  email?: string;
  avatar_image?: string | null;
};

const SUGGESTED_OUTFITS: Record<
  OutfitCategory,
  { id: string; name: string; image: any }[]
> = {
  Casual: [
    {
      id: "c1",
      name: "EverydayCasual",
      image: require("../../assets/images/shirt1.jpg"),
    },
    {
      id: "c2",
      name: "Weekend Look",
      image: require("../../assets/images/look1.jpg"),
    },
  ],
  Date: [
    {
      id: "d1",
      name: "Dinner Date",
      image: require("../../assets/images/look3.jpg"),
    },
    {
      id: "d2",
      name: "Coffee Date",
      image: require("../../assets/images/shirt2.jpg"),
    },
  ],
  Work: [
    {
      id: "w1",
      name: "Office Ready",
      image: require("../../assets/images/look2.jpg"),
    },
    {
      id: "w2",
      name: "BusinessCasual",
      image: require("../../assets/images/shirt3.jpg"),
    },
  ],
  Party: [
    {
      id: "p1",
      name: "Night Out",
      image: require("../../assets/images/look4.jpg"),
    },
    {
      id: "p2",
      name: "Statement Look",
      image: require("../../assets/images/shoe1.jpg"),
    },
  ],
};

const POPULAR_PICKS = [
  {
    id: "pp1",
    name: "Classic White Tee",
    image: require("../../assets/images/shirt1.jpg"),
  },
  {
    id: "pp2",
    name: "Denim Jacket",
    image: require("../../assets/images/look2.jpg"),
  },
  {
    id: "pp3",
    name: "StatementSneakers",
    image: require("../../assets/images/shoe1.jpg"),
  },
  {
    id: "pp4",
    name: "Summer Dress",
    image: require("../../assets/images/look3.jpg"),
  },
];

const RECENTLY_OUTFIT = [
  {
    id: "r1",
    name: "Beige Hoodie",
    image: require("../../assets/images/shirt2.jpg"),
  },
  {
    id: "r2",
    name: "Black Jeans",
    image: require("../../assets/images/shirt3.jpg"),
  },
  {
    id: "r3",
    name: "Sneakers",
    image: require("../../assets/images/shoe1.jpg"),
  },
];

const OUTFIT_IMAGE_KEYS: Record<string, string> = {
  c1: "shirt1",
  c2: "look1",
  d1: "look3",
  d2: "shirt2",
  w1: "look2",
  w2: "shirt3",
  p1: "look4",
  p2: "shoe1",
};

export default function HomeScreen() {
  const router = useRouter();

  const { addToWishlist, removeFromWishlist } = useAppData();

  const [activeOutfitCategory, setActiveOutfitCategory] =
    useState<OutfitCategory>("Casual");

  const [savedMap, setSavedMap] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [savedOutfitIds, setSavedOutfitIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!toastMessage) return;

    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [toastMessage]);

  const loadUserProfile = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUserProfile(data);
        return;
      }

      console.log("Profile load failed:", data);

      const savedUser = await SecureStore.getItemAsync("user");

      if (savedUser) {
        setUserProfile(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Home profile error:", error);

      try {
        const savedUser = await SecureStore.getItemAsync("user");

        if (savedUser) {
          setUserProfile(JSON.parse(savedUser));
        }
      } catch (storageError) {
        console.error("Saved user error:", storageError);
      }
    }
  }, []);

  const loadSavedOutfits = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
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
        console.log("Saved outfits invalid response:", text);
        return;
      }

      if (!response.ok) {
        console.log("Saved outfits load failed:", data);
        return;
      }

      const ids = new Set<string>(
        Array.isArray(data)
          ? data.map(
            (item: { recommendation_id: string }) =>
              item.recommendation_id
          )
          : []
      );

      setSavedOutfitIds(ids);
    } catch (error) {
      console.error("Saved outfits load error:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
      loadSavedOutfits();
    }, [loadUserProfile, loadSavedOutfits])
  );

  const weatherTemp = 34;

  const handleToggleWishlist = (
    item: {
      id: string;
      name: string;
      image: any;
    },
    showToast: boolean
  ) => {
    const existingWishlistId = savedMap[item.id];

    if (existingWishlistId) {
      removeFromWishlist(existingWishlistId);

      setSavedMap((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } else {
      const newWishlistId = addToWishlist({
        name: item.name,
        brand: "",
        source: "",
        price: "",
        image: item.image,
      });

      setSavedMap((prev) => ({
        ...prev,
        [item.id]: newWishlistId,
      }));

      if (showToast) {
        setToastMessage("Added to wishlist successfully");
      }
    }
  };

  const handleToggleOutfit = async (item: {
    id: string;
    name: string;
    image: any;
  }) => {
    try {
      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const isSaved = savedOutfitIds.has(item.id);

      if (isSaved) {
        const response = await fetch(
          `${API_URL}/api/saved-outfits/${item.id}`,
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

        setSavedOutfitIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });

        setToastMessage("Removed from saved outfits");
      } else {
        const response = await fetch(`${API_URL}/api/saved-outfits`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recommendation_id: item.id,
            outfit_name: item.name,
            image_key: OUTFIT_IMAGE_KEYS[item.id] || null,
          }),
        });

        const text = await response.text();

        let data: any = {};

        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          throw new Error("Invalid server response");
        }

        if (!response.ok) {
          throw new Error(data.error || "Failed to save outfit");
        }

        setSavedOutfitIds((prev) => {
          const next = new Set(prev);
          next.add(item.id);
          return next;
        });

        setToastMessage("Outfit saved successfully");
      }
    } catch (error) {
      console.error("Toggle saved outfit error:", error);

      setToastMessage(
        error instanceof Error
          ? error.message
          : "Unable to update saved outfit"
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello! 👋</Text>

            <Text style={styles.name}>
              {userProfile?.full_name || "User"}
            </Text>
          </View>

          <Image
            source={
              userProfile?.avatar_image
                ? { uri: userProfile.avatar_image }
                : require("../../assets/images/avatar.png")
            }
            style={styles.avatar}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitleNoMargin}>
            Today's Recommendation
          </Text>

          <View style={styles.weatherBadge}>
            <Ionicons
              name="sunny-outline"
              size={14}
              color="#111827"
            />

            <Text style={styles.weatherText}>{weatherTemp}°C</Text>
          </View>
        </View>

        <Text style={styles.subTitle}>Suggested Outfits</Text>

        <View style={styles.categoryTabRow}>
          {OUTFIT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveOutfitCategory(cat)}
              style={[
                styles.categoryTab,
                activeOutfitCategory === cat &&
                styles.categoryTabActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  activeOutfitCategory === cat &&
                  styles.categoryTabTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.outfitGrid}>
          {SUGGESTED_OUTFITS[activeOutfitCategory].map((item) => (
            <View key={item.id} style={styles.outfitCard}>
              <Image
                source={item.image}
                style={styles.outfitImage}
              />

              <TouchableOpacity
                style={styles.heartButton}
                onPress={() => handleToggleOutfit(item)}
              >
                <Ionicons
                  name={
                    savedOutfitIds.has(item.id)
                      ? "bookmark"
                      : "bookmark-outline"
                  }
                  size={18}
                  color="#111827"
                />
              </TouchableOpacity>

              <Text style={styles.outfitName}>{item.name}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recently Outfit</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {RECENTLY_OUTFIT.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.smallCard}
              onPress={() =>
                router.push(`/outfit-detail?id=${item.id}`)
              }
            >
              <Image
                source={item.image}
                style={styles.smallImage}
              />

              <Text style={styles.smallTitle}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Popular Picks!</Text>

        {toastMessage && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        <View style={styles.outfitGrid}>
          {POPULAR_PICKS.map((item) => (
            <View key={item.id} style={styles.outfitCard}>
              <Image
                source={item.image}
                style={styles.outfitImage}
              />

              <TouchableOpacity
                style={styles.heartButton}
                onPress={() => handleToggleWishlist(item, true)}
              >
                <Ionicons
                  name={
                    savedMap[item.id]
                      ? "star"
                      : "star-outline"
                  }
                  size={18}
                  color={
                    savedMap[item.id] ? "#E11D48" : "#111827"
                  }
                />
              </TouchableOpacity>

              <Text style={styles.outfitName}>{item.name}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomTabBar active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  toast: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  toastText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },

  greeting: {
    fontSize: 18,
    color: "#111827",
  },

  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  sectionHeaderRow: {
    marginTop: 8,
    marginHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    marginTop: 30,
    marginLeft: 20,
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },

  sectionTitleNoMargin: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },

  weatherBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  weatherText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  subTitle: {
    marginTop: 16,
    marginLeft: 20,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  categoryTabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    gap: 10,
  },

  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },

  categoryTabActive: {
    backgroundColor: "#111827",
  },

  categoryTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },

  categoryTabTextActive: {
    color: "#FFFFFF",
  },

  outfitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 16,
  },

  outfitCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  outfitImage: {
    width: "100%",
    height: 150,
    borderRadius: 15,
    resizeMode: "cover",
  },

  heartButton: {
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

  outfitName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  smallCard: {
    backgroundColor: "#FFFFFF",
    width: 140,
    marginLeft: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  smallImage: {
    width: 110,
    height: 120,
    borderRadius: 15,
  },

  smallTitle: {
    marginTop: 10,
    fontWeight: "600",
    color: "#111827",
  },
});