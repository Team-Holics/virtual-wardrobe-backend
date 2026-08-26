import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../../src/app/BottomTabBar";

// ---- Static option data ----
const SKIN_TONES = ["#F3D5B5", "#E8B98A", "#C68863", "#A8673D", "#8B5A2B", "#5C3A21"];
const BODY_TYPES = ["Slim", "Athletic", "Curvy", "Plus"];
const STYLE_VIBES = ["Casual", "Streetwear", "Minimalist", "Formal", "Boho", "Sporty"];

export default function ProfileScreen() {
  const router = useRouter();
  const handleLogout = () => {router.replace("/login");};
  const [skinTone, setSkinTone] = useState(2);
  const [height, setHeight] = useState("5'10\"");
  const [weight, setWeight] = useState("165 lb");
  const [bodyType, setBodyType] = useState("Athletic");
  const [styles_, setStyles] = useState<string[]>(["Casual", "Formal"]);

  const toggleStyle = (style: string) => {
    setStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleSave = () => {
    // TODO: replace with a real API call, e.g. PATCH /api/profile
    console.log("Saving profile:", { skinTone, height, weight, bodyType, styles_ });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Profile</Text>
            <Text style={styles.subtitle}>Personalize your avatar and style preferences</Text>
          </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings-outline" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
           </View>
        </View>

        {/* Avatar preview */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <View style={styles.avatarInner} />
          </View>
          <Text style={styles.avatarName}>Alex Johnson</Text>
          <TouchableOpacity style={styles.editAvatarButton}>
            <Text style={styles.editAvatarText}>Edit Avatar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Customize Your Avatar */}
        <Text style={styles.sectionTitle}>Customize Your Avatar</Text>
        <Text style={styles.sectionSubtitle}>Fine-tune appearance and style details</Text>

        {/* Skin tone */}
        <View style={styles.block}>
          <View style={styles.rowBetween}>
            <Text style={styles.fieldLabel}>Skin Tone</Text>
            <Text style={styles.fieldHint}>Selected tone</Text>
          </View>
          <View style={styles.swatchRow}>
            {SKIN_TONES.map((color, i) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSkinTone(i)}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  skinTone === i && styles.swatchSelected,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Body measurements */}
        <View style={styles.block}>
          <View style={styles.rowBetween}>
            <Text style={styles.fieldLabel}>Body Measurements</Text>
            <Text style={styles.fieldHint}>Approximate fit</Text>
          </View>

          <View style={styles.measurementRow}>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Height</Text>
              <TextInput
                value={height}
                onChangeText={setHeight}
                style={styles.input}
              />
            </View>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Weight</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                style={styles.input}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Body Type</Text>
          <View style={styles.pillRow}>
            {BODY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setBodyType(type)}
                style={[styles.pill, bodyType === type && styles.pillActive]}
              >
                <Text style={[styles.pillText, bodyType === type && styles.pillTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Style preferences */}
        <View style={styles.block}>
          <View style={styles.rowBetween}>
            <Text style={styles.fieldLabel}>Style Preferences</Text>
            <Text style={styles.fieldHint}>Choose your vibe</Text>
          </View>
          <View style={styles.pillRow}>
            {STYLE_VIBES.map((style) => (
              <TouchableOpacity
                key={style}
                onPress={() => toggleStyle(style)}
                style={[styles.pill, styles_.includes(style) && styles.pillActive]}
              >
                <Text
                  style={[styles.pillText, styles_.includes(style) && styles.pillTextActive]}
                >
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save Profile</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomTabBar active="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 16,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#9CA3AF", marginTop: 4, maxWidth: 240 },
  iconButton: { padding: 8, borderRadius: 999, backgroundColor: "#F3F4F6" },

  avatarSection: { alignItems: "center", marginTop: 16 },
  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#818CF8" },
  avatarName: { marginTop: 12, fontWeight: "600", fontSize: 16, color: "#111827" },
  editAvatarButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#111827",
    borderRadius: 999,
  },
  editAvatarText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },

  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 24 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  sectionSubtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 2, marginBottom: 20 },

  block: { marginBottom: 24 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  fieldHint: { fontSize: 11, color: "#9CA3AF" },

  swatchRow: { flexDirection: "row", gap: 12 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "transparent" },
  swatchSelected: { borderColor: "#111827" },

  measurementRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  measurementInput: { flex: 1 },
  inputLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },

  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  pillActive: { backgroundColor: "#111827" },
  pillText: { fontSize: 13, fontWeight: "500", color: "#4B5563" },
  pillTextActive: { color: "#FFFFFF" },

  primaryButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
