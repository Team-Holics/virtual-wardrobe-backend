import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppData } from "../../src/context/AppDataContext";

export default function SavedOutfitsScreen() {
  const router = useRouter();
  const { outfitItems, toggleOutfitItem } = useAppData();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Outfits</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.grid}>
          {outfitItems.length === 0 && (
            <Text style={styles.emptyText}>
              No outfits saved yet. Bookmark outfits you like from Home to see them here.
            </Text>
          )}

          {outfitItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={item.image} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => toggleOutfitItem(item)}
              >
                <Ionicons name="bookmark" size={16} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.name}>{item.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: { color: "#9CA3AF", fontSize: 14, textAlign: "center", marginTop: 60, width: "100%" },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 20 },
  card: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  image: { width: "100%", height: 170, borderRadius: 15, resizeMode: "cover" },
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
  name: { marginTop: 8, fontSize: 14, fontWeight: "600", color: "#111827" },
});
