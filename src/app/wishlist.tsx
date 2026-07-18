import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../../src/app/BottomTabBar";

const FILTERS = ["All", "Available", "On Sale", "Out of Stock"] as const;
type Filter = (typeof FILTERS)[number];

type WishlistItem = {
  id: string;
  name: string;
  brand: string;
  source: string;
  price: number;
  badge: { type: "match" | "similar"; label: string };
  priceTracking: boolean;
  alert: string;
  fill: number;
};

// Mock data — in production this comes from GET /api/wishlist
const ITEMS: WishlistItem[] = [
  {
    id: "1",
    name: "Tailored Black Blazer",
    brand: "COS",
    source: "Zara",
    price: 128,
    badge: { type: "match", label: "Matches your wardrobe" },
    priceTracking: true,
    alert: "Price Drop Alert: On",
    fill: 70,
  },
  {
    id: "2",
    name: "Structured Leather Bag",
    brand: "Mansur Gavriel",
    source: "Nordstrom",
    price: 245,
    badge: { type: "similar", label: "Similar item owned" },
    priceTracking: false,
    alert: "Notify me when available",
    fill: 25,
  },
  {
    id: "3",
    name: "Minimal White Sneakers",
    brand: "Common Projects",
    source: "SSENSE",
    price: 390,
    badge: { type: "match", label: "Matches your wardrobe" },
    priceTracking: true,
    alert: "Price Drop Alert: On",
    fill: 85,
  },
  {
    id: "4",
    name: "Satin Midi Skirt",
    brand: "Reformation",
    source: "Revolve",
    price: 168,
    badge: { type: "similar", label: "Similar item owned" },
    priceTracking: false,
    alert: "Notify me when available",
    fill: 15,
  },
];

function WishlistCard({ item }: { item: WishlistItem }) {
  const isMatch = item.badge.type === "match";
  return (
    <View style={styles.card}>
      <View style={styles.thumbnail} />
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

        <View style={[styles.badge, isMatch ? styles.badgeMatch : styles.badgeSimilar]}>
          <Ionicons
            name={isMatch ? "checkmark" : "alert-circle-outline"}
            size={11}
            color={isMatch ? "#15803D" : "#B45309"}
          />
          <Text style={[styles.badgeText, { color: isMatch ? "#15803D" : "#B45309" }]}>
            {item.badge.label}
          </Text>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${item.fill}%` }]} />
          </View>
          <TouchableOpacity>
            <Ionicons name="heart" size={16} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="bag-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.alertText}>{item.alert}</Text>
      </View>
    </View>
  );
}

export default function WishlistScreen() {
  const [filter, setFilter] = useState<Filter>("All");

  const filteredItems = ITEMS.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Available") return item.priceTracking;
    if (filter === "On Sale") return item.fill > 60;
    if (filter === "Out of Stock") return !item.priceTracking;
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="heart" size={18} color="#111827" />
          <Text style={styles.title}>My Wishlist</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="search" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.pill, filter === f && styles.pillActive]}
          >
            <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <WishlistCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No items in this filter yet.</Text>
        }
      />

      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Shop All Wishlist Items</Text>
      </TouchableOpacity>
      <BottomTabBar active="upload" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 24 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  filterRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F3F4F6" },
  pillActive: { backgroundColor: "#111827" },
  pillText: { fontSize: 12, fontWeight: "500", color: "#4B5563" },
  pillTextActive: { color: "#FFFFFF" },

  listContent: { paddingVertical: 16 },
  emptyText: { textAlign: "center", color: "#9CA3AF", fontSize: 13, paddingVertical: 24 },

  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 14,
  },
  thumbnail: { width: 64, height: 64, borderRadius: 10, backgroundColor: "#F3F4F6" },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  itemName: { flex: 1, fontSize: 14, fontWeight: "600", color: "#111827" },
  itemPrice: { fontSize: 14, fontWeight: "700", color: "#111827" },
  itemSource: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
  },
  badgeMatch: { backgroundColor: "#F0FDF4" },
  badgeSimilar: { backgroundColor: "#FFFBEB" },
  badgeText: { fontSize: 10, fontWeight: "600" },

  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "#F3F4F6", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: "#111827" },

  alertText: { fontSize: 10, color: "#9CA3AF", marginTop: 4 },

  primaryButton: {
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
