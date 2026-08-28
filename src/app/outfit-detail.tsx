import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OutfitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Outfit Detail</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Details for outfit "{id}" coming soon.</Text>
      </View>
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
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  placeholderText: { color: "#9CA3AF", fontSize: 14 },
});
