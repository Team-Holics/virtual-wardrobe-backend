import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../../src/app/BottomTabBar";

const API_URL = "http://127.0.0.1:3000";

type ProfileData = {
  user_id?: number;
  full_name?: string;
  email?: string;

  height?: number | string | null;
  weight?: number | string | null;
  chest?: number | string | null;
  waist?: number | string | null;
  hip?: number | string | null;
  shoulder_width?: number | string | null;

  style_preferences?: string | null;
  avatar_image?: string | null;
};

function formatMeasurement(
  value: number | string | null | undefined,
  unit: string
) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return `${value} ${unit}`;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "Not set"}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Failed to load profile."
        );
      }

      setProfile(data);
    } catch (error) {
      console.error("Load profile error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync("authToken");
              await SecureStore.deleteItemAsync("user");

              router.replace("/login");
            } catch (error) {
              console.error("Logout error:", error);

              Alert.alert(
                "Error",
                "Unable to log out. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#818CF8" />
          <Text style={styles.loadingText}>
            Loading profile...
          </Text>
        </View>

        <BottomTabBar active="profile" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>My Profile</Text>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#DC2626"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {profile?.avatar_image ? (
              <Image
                source={{ uri: profile.avatar_image }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarInner}>
                <Ionicons
                  name="person-outline"
                  size={38}
                  color="#FFFFFF"
                />
              </View>
            )}
          </View>

          <Text style={styles.avatarName}>
            {profile?.full_name || "User"}
          </Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/profile-view")}
          >
            <Ionicons
              name="pencil-outline"
              size={16}
              color="#FFFFFF"
            />

            <Text style={styles.editText}>
              Edit Avatar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsCard}>
          <DetailRow
            label="Height"
            value={formatMeasurement(profile?.height, "cm")}
          />

          <DetailRow
            label="Weight"
            value={formatMeasurement(profile?.weight, "kg")}
          />

          <DetailRow
            label="Chest"
            value={formatMeasurement(profile?.chest, "cm")}
          />

          <DetailRow
            label="Waist"
            value={formatMeasurement(profile?.waist, "cm")}
          />

          <DetailRow
            label="Hip"
            value={formatMeasurement(profile?.hip, "cm")}
          />

          <DetailRow
            label="Shoulder Width"
            value={formatMeasurement(
              profile?.shoulder_width,
              "cm"
            )}
          />

          <DetailRow
            label="Style Preferences"
            value={
              profile?.style_preferences?.trim()
                ? profile.style_preferences
                : "None set"
            }
          />
        </View>
      </View>

      <BottomTabBar active="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  iconButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },

  avatarSection: {
    alignItems: "center",
    marginTop: 24,
  },

  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#818CF8",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    resizeMode: "cover",
  },

  avatarName: {
    marginTop: 12,
    fontWeight: "600",
    fontSize: 16,
    color: "#111827",
  },

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

  editText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },

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

  detailLabel: {
    fontSize: 14,
    color: "#9CA3AF",
  },

  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    maxWidth: "58%",
    textAlign: "right",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9CA3AF",
  },
});