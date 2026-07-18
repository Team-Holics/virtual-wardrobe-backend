import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../../src/app/BottomTabBar";

const VIEW_TABS = ["Uploaded Item", "Full Outfit", "Top Only"] as const;

// Fit analysis would normally come back from a sizing/computer-vision API
// call after the item + avatar measurements are sent to the backend.
const FIT_DATA = {
  confidence: 87,
  recommendedSize: "M",
  notes: ["Fits well around shoulders", "Slightly relaxed at waist"],
};

export default function TryOnScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof VIEW_TABS)[number]>(VIEW_TABS[0]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Virtual Try-On</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="share-outline" size={16} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Avatar preview stage */}
      <View style={styles.stage}>
        {/* Replace with the rendered avatar + garment composite image */}
        <View style={styles.stageHead} />
        <View style={styles.stageBody} />
      </View>

      {/* View tabs */}
      <View style={styles.tabRow}>
        {VIEW_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.pill, activeTab === tab && styles.pillActive]}
          >
            <Text style={[styles.pillText, activeTab === tab && styles.pillTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Add to Wardrobe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Add to Wishlist</Text>
        </TouchableOpacity>
      </View>
      <BottomTabBar active="upload" />
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
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  stageHead: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FDE68A",
    marginBottom: -40,
    zIndex: 2,
  },
  stageBody: { width: 140, height: 170, borderRadius: 28, backgroundColor: "#818CF8" },

  tabRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F3F4F6" },
  pillActive: { backgroundColor: "#111827" },
  pillText: { fontSize: 12, fontWeight: "500", color: "#4B5563" },
  pillTextActive: { color: "#FFFFFF" },

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

  actions: { marginTop: "auto", paddingVertical: 16, gap: 8 },
  primaryButton: { paddingVertical: 16, borderRadius: 14, backgroundColor: "#111827", alignItems: "center" },
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
