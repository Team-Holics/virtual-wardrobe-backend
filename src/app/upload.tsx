import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../../src/app/BottomTabBar";

// Each action the user can take with an uploaded item.
// Kept as data so a 4th/5th option can be added without touching layout code.
const OPTIONS = [
  {
    icon: "shirt-outline" as const,
    title: "Virtual Try-On",
    description: "See how this item looks on your avatar",
    route: "/tryon",
  },
  {
    icon: "layers-outline" as const,
    title: "Add to Wardrobe",
    description: "Save to your digital closet — we'll check for duplicates",
    route: "/wardrobe",
  },
  {
    icon: "heart-outline" as const,
    title: "Add to Wishlist",
    description: "Save for later and track price or availability",
    route: "/wishlist",
  },
];

export default function UploadScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={{ flex: 1 }}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>What would you like to do?</Text>
          <Text style={styles.subtitle}>Choose an option to get started</Text>
        </View>
        <View style={styles.sparkleButton}>
          <Ionicons name="sparkles-outline" size={18} color="#9CA3AF" />
        </View>
      </View>

      <View style={styles.optionList}>
        {OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.route}
            style={styles.optionCard}
            onPress={() => router.push(option.route as any)}
          >
            <View style={styles.optionIconWrap}>
              <Ionicons name={option.icon} size={18} color="#374151" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.aiHintBanner}>
        <Ionicons name="sparkles" size={16} color="#818CF8" style={{ marginTop: 2 }} />
        <Text style={styles.aiHintText}>
          Our AI will analyze your item for style compatibility and duplicates before adding it.
        </Text>
      </View>
      </View>
      <BottomTabBar active="upload" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 24 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", lineHeight: 26 },
  subtitle: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  sparkleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  optionList: { marginTop: 20, gap: 12 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  optionDescription: { fontSize: 12, color: "#9CA3AF", marginTop: 2, lineHeight: 16 },

  aiHintBanner: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    padding: 12,
    marginTop: 20,
  },
  aiHintText: { flex: 1, fontSize: 12, color: "#4338CA", lineHeight: 17 },
});
