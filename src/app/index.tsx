import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Soft pink-to-white gradient behind the top half of the screen */}
      <LinearGradient
        colors={["#F3E5F5", "#FDFBFB"]}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.content} edges={["top", "bottom"]}>
        <View style={styles.logoBlock}>
          {/* Swap this for your real logo asset, e.g.:
              <Image source={require("../assets/images/logo.png")} style={styles.logoImage} resizeMode="contain" />
          */}
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <Text style={styles.brandLine1}>AI Fashion</Text>
          <Text style={styles.brandLine2}>Assistant</Text>
        </View>

        <Text style={styles.tagline}>Your Perfect Outfit Starts Here</Text>

        <View style={styles.spacer} />

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/login")} style={styles.loginRow}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFBFB" },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
  },
  content: { flex: 1, paddingHorizontal: 32 },

  logoBlock: { alignItems: "center", marginTop: "35%" },
  logoImage: { width: 150, height: 150 },

  brandLine1: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "serif", // replace with a loaded custom font, e.g. PlayfairDisplay-Bold
    color: "#1A1A1A",
    marginTop: 4,
  },
  brandLine2: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: -2,
  },

  tagline: {
    textAlign: "center",
    fontSize: 24,
    fontStyle: "italic",
    fontFamily: "serif", // replace with a script font, e.g. DancingScript-Regular
    color: "#8B3A4A",
    marginTop: 28,
  },

  spacer: { flex: 1 },

  actions: { marginBottom: 40 },
  signUpButton: {
    backgroundColor: "#2B2B2B",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  signUpText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },

  loginRow: { marginTop: 16, alignItems: "center" },
  loginText: { fontSize: 13, color: "#4B5563" },
  loginLink: { fontWeight: "600", color: "#1A1A1A" },
});
