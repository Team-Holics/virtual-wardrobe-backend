import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type TabKey = "home" | "stylist" | "profile" | "upload";

const TABS: { key: TabKey; label: string; route: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "home", label: "Home", route: "/home", icon: "home-outline" },
  { key: "stylist", label: "AI Stylist", route: "/stylist", icon: "sparkles-outline" },
  { key: "upload", label: "Upload", route: "/upload", icon: "add-circle-outline" },
  { key: "profile", label: "Profile", route: "/profile", icon: "person-outline" },
];

export default function BottomTabBar({ active }: { active: TabKey }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => router.push(tab.route as any)}
          >
            <Ionicons
              name={isActive ? (tab.icon.replace("-outline", "") as any) : tab.icon}
              size={22}
              color={isActive ? "#111827" : "#9CA3AF"}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingBottom: 24, // extra padding for the home-indicator area on iOS
  },
  tab: { flex: 1, alignItems: "center", gap: 4 },
  label: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  labelActive: { color: "#111827", fontWeight: "700" },
});
