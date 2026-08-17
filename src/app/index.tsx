import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.pinkOval} />


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
  pinkOval: {
    position: "absolute",
    top: -300,
    left: -100,
    right: -100,
    height: 740,
    borderRadius: 350,
    backgroundColor: "#d084dc",
  },
  content: { flex: 1, paddingHorizontal: 32 },

  logoBlock: { alignItems: "center", marginTop: "35%" },
  logoImage: { width: 250, height: 250, marginTop: 25},

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
