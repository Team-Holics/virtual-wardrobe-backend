import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function StylistScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        sender: "user",
        text: message,
      },
    ]);

    setMessage("");
  };

  const selectSuggestion = (text: string) => {
    setMessage(text);
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>

      <TouchableOpacity
        style={styles.circleButton}
        onPress={() => router.back()}
      >
        <Ionicons
          name="chevron-back"
          size={28}
          color="#000"
        />
      </TouchableOpacity>

        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Ionicons
              name="person"
              size={24}
              color="#777"
            />
          </View>

          <View>
            <Text style={styles.name}>Eli</Text>
            <Text style={styles.subtitle}>AI Stylist</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.circleButton}>
          <Ionicons
            name="time-outline"
            size={27}
            color="#000"
          />
        </TouchableOpacity>

      </View>


      {/* CHAT AREA */}

      {messages.length === 0 ? (

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            How can I help you, Myat?
          </Text>
        </View>

      ) : (

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chat}
          renderItem={({ item }) => (

            <View style={styles.userMessage}>
              <Text style={styles.userText}>
                {item.text}
              </Text>
            </View>

          )}
        />

      )}


      {/* QUICK SUGGESTIONS */}

      <View style={styles.suggestions}>

        <TouchableOpacity
          style={styles.suggestionButton}
          onPress={() =>
            selectSuggestion("Make an outfit")
          }
        >
          <Text>Make an outfit</Text>
        </TouchableOpacity>

                <TouchableOpacity
          style={styles.suggestionButton}
          onPress={() => selectSuggestion("Create a packing list")}
        >
          <Text style={styles.suggestionButtonText}>
            Make an outfit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.suggestionButton}
          onPress={() =>
            selectSuggestion("Rate my outfit")
          }
        >
          <Text>Rate my outfit</Text>
        </TouchableOpacity>

      </View>


      {/* INPUT */}

      <View style={styles.inputContainer}>

        <TextInput
          style={styles.input}
          placeholder="Ask anything"
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
        >
          <Ionicons
            name="arrow-up"
            size={26}
            color="#fff"
          />
        </TouchableOpacity>

      </View>

    </View>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    height: 110,
    paddingTop: 45,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  circleButton: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
  },

  profile: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 25,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  name: {
    fontSize: 17,
    fontWeight: "600",
  },

  subtitle: {
    fontSize: 13,
    color: "#888",
  },

  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },

  welcomeText: {
    fontSize: 22,
    fontWeight: "500",
  },

  chat: {
    padding: 20,
  },

  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 20,
    maxWidth: "80%",
    marginBottom: 15,
  },

  userText: {
    color: "#fff",
    fontSize: 16,
  },

  suggestions: {
    flexDirection: "row",
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 12,
  },

  suggestionButton: {
    backgroundColor: "#f4f4f4",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 25,
  },

  suggestionButtonText: {
    fontSize: 14,
  },

  inputContainer: {
    marginHorizontal: 18,
    marginBottom: 20,
    minHeight: 120,
    backgroundColor: "#fafafa",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#eee",
  },

  input: {
    fontSize: 16,
    minHeight: 50,
    paddingRight: 60,
  },

  sendButton: {
    position: "absolute",
    right: 15,
    bottom: 15,
    width: 52,
    height: 52,
    borderRadius: 30,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

});