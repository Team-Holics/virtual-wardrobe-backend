import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppData } from "../../src/context/AppDataContext";

const STYLE_VIBES = ["Casual", "Streetwear", "Minimalist", "Formal", "Boho", "Sporty"];

export default function ProfileEditScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAppData();

  const [height, setHeight] = useState(profile.height);
  const [weight, setWeight] = useState(profile.weight);
  const [chest, setChest] = useState(profile.chest);
  const [waist, setWaist] = useState(profile.waist);
  const [hip, setHip] = useState(profile.hip);
  const [shoulderWidth, setShoulderWidth] = useState(profile.shoulderWidth);
  const [styles_, setStyles] = useState<string[]>(profile.styles);

  const toggleStyle = (style: string) => {
    setStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleSave = () => {
    updateProfile({ height, weight, chest, waist, hip, shoulderWidth, styles: styles_ });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>Personalize your avatar and style preferences</Text>
          </View>
          <View style={{ width: 36 }} />
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
                placeholder="e.g. 178 cm"
                style={styles.input}
              />
            </View>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Weight</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g. 75 kg"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.measurementRow}>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Chest</Text>
              <TextInput
                value={chest}
                onChangeText={setChest}
                placeholder="e.g. 38 in"
                style={styles.input}
              />
            </View>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Waist</Text>
              <TextInput
                value={waist}
                onChangeText={setWaist}
                placeholder="e.g. 32 in"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.measurementRow}>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Hip</Text>
              <TextInput
                value={hip}
                onChangeText={setHip}
                placeholder="e.g. 40 in"
                style={styles.input}
              />
            </View>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Shoulder Width</Text>
              <TextInput
                value={shoulderWidth}
                onChangeText={setShoulderWidth}
                placeholder="e.g. 18 in"
                style={styles.input}
              />
            </View>
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
                <Text style={[styles.pillText, styles_.includes(style) && styles.pillTextActive]}>
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
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", textAlign: "center" },
  subtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 4, maxWidth: 200, textAlign: "center" },

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
