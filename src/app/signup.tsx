import { router } from "expo-router";
import { useState } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    router.replace("/home");
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.pinkCircle} />

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        Join your AI Fashion Assistant
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

     <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.signupButton}
        onPress={handleSignup}
      >
        <Text style={styles.signupText}>Create Account</Text>
      </TouchableOpacity>

      <View style={styles.bottomRow}>
        <Text>Already have an account? </Text>

        <TouchableOpacity
          onPress={() => router.push("/login")}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  pinkCircle: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "#F8EAF2",
    top: -180,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#8C4D5A",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
  },

  input: {
    width: "100%",
    height: 55,
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    paddingHorizontal: 18,
    marginBottom: 18,
    fontSize: 16,
  },

  signupButton: {
    width: "100%",
    height: 55,
    backgroundColor: "#8C4D5A",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  signupText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  bottomRow: {
    flexDirection: "row",
    marginTop: 25,
  },

  loginText: {
    color: "#8C4D5A",
    fontWeight: "bold",
  },
  errorText: {
    color: "#D14343",
    fontSize: 13,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
});