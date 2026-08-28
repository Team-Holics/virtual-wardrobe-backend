import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../../src/app/BottomTabBar";
import { useAppData } from "../../src/context/AppDataContext";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "Not set"}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useAppData();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => router.replace("/login") },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Profile</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings-outline" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar placeholder — teammate will replace this with the real
          avatar image/render, driven by the measurement data saved below */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <View style={styles.avatarInner} />
        </View>
        <Text style={styles.avatarName}>Alex Johnson</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => router.push("/profile-view")}>
          <Ionicons name="pencil-outline" size={16} color="#FFFFFF" />
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsCard}>
        <DetailRow label="Height" value={profile.height} />
        <DetailRow label="Weight" value={profile.weight} />
        <DetailRow label="Chest" value={profile.chest} />
        <DetailRow label="Waist" value={profile.waist} />
        <DetailRow label="Hip" value={profile.hip} />
        <DetailRow label="Shoulder Width" value={profile.shoulderWidth} />
        <DetailRow
          label="Style Preferences"
          value={profile.styles.length > 0 ? profile.styles.join(", ") : "None set"}
        />
      </View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        </ScrollView>
      <BottomTabBar active="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 24 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  iconButton: { padding: 8, borderRadius: 999, backgroundColor: "#F3F4F6" },

  avatarSection: { alignItems: "center", marginTop: 24 },
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
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  editText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },

  detailsCard: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: { fontSize: 14, color: "#9CA3AF" },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
});
