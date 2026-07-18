import { Ionicons } from "@expo/vector-icons";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import BottomTabBar from "../../src/app/BottomTabBar";

export default function StylistScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Ionicons
            name="sparkles-outline"
            size={26}
            color="#fff"
          />
        </View>

        <Text style={styles.headerTitle}>
          AI Stylist
        </Text>
      </View>

      {/* AI Message */}
      <View style={styles.chatBubble}>
        <Text style={styles.chatText}>
          Based on your wardrobe, here's what I recommend for a casual Friday outing ✨
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Describe your occasion, mood, or style..."
          placeholderTextColor="#888"
          style={styles.searchInput}
        />

        <TouchableOpacity style={styles.sendButton}>
          <Ionicons
            name="paper-plane-outline"
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Categories */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[styles.categoryButton, styles.activeCategory]}
        >
          <Text style={styles.activeCategoryText}>
            Casual
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.categoryButton}>
          <Text style={styles.categoryText}>
            Formal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.categoryButton}>
          <Text style={styles.categoryText}>
            Work
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.categoryButton}>
          <Text style={styles.categoryText}>
            Date Night
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.categoryButton}>
          <Text style={styles.categoryText}>
            Summer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.categoryButton}>
          <Text style={styles.categoryText}>
            Party
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Suggested */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Suggested Outfits
        </Text>

        <TouchableOpacity>
          <Text style={styles.seeAll}>
            See All
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardGrid}>

        {/* Outfit 1 */}
        <TouchableOpacity style={styles.card}>
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/look1.jpg")}
              style={styles.cardImage}
            />

            <TouchableOpacity style={styles.favoriteButton}>
              <Ionicons
                name="heart-outline"
                size={20}
                color="#111"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle}>
            Smart Casual
          </Text>

          <Text style={styles.cardSubtitle}>
            Beige shirt + black pants
          </Text>
        </TouchableOpacity>

        {/* Outfit 2 */}
        <TouchableOpacity style={styles.card}>
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/look2.jpg")}
              style={styles.cardImage}
            />

            <TouchableOpacity style={styles.favoriteButton}>
              <Ionicons
                name="heart-outline"
                size={20}
                color="#111"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle}>
            Street Style
          </Text>

          <Text style={styles.cardSubtitle}>
            Hoodie & denim
          </Text>
        </TouchableOpacity>

        {/* Outfit 3 */}
        <TouchableOpacity style={styles.card}>
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/look3.jpg")}
              style={styles.cardImage}
            />

            <TouchableOpacity style={styles.favoriteButton}>
              <Ionicons
                name="heart-outline"
                size={20}
                color="#111"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle}>
            Office Chic
          </Text>

          <Text style={styles.cardSubtitle}>
            Minimal business look
          </Text>
        </TouchableOpacity>

        {/* Outfit 4 */}
        <TouchableOpacity style={styles.card}>
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/look4.jpg")}
              style={styles.cardImage}
            />

            <TouchableOpacity style={styles.favoriteButton}>
              <Ionicons
                name="heart-outline"
                size={20}
                color="#111"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle}>
            Date Night
          </Text>

          <Text style={styles.cardSubtitle}>
            Elegant evening outfit
          </Text>
        </TouchableOpacity>

      </View>

      <View style={{ height: 40 }} />
      <BottomTabBar active="stylist" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
      container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 60,
    marginBottom: 30,
  },

  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: "#111",
  },

  chatBubble: {
    backgroundColor: "#ECECEC",
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },

  chatText: {
    fontSize: 18,
    lineHeight: 28,
    color: "#222",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingHorizontal: 22,
    height: 56,
    fontSize: 16,
    elevation: 3,
  },

  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    elevation: 3,
  },

  categoryContainer: {
    paddingBottom: 25,
  },

  categoryButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
    marginRight: 12,
    elevation: 2,
  },

  activeCategory: {
    backgroundColor: "#111",
  },

  categoryText: {
    fontSize: 16,
    color: "#111",
  },

  activeCategoryText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },

  seeAll: {
    fontSize: 16,
    color: "#666",
  },

  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 12,
    marginBottom: 22,
    elevation: 3,
  },

  imageContainer: {
    position: "relative",
  },

  cardImage: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    resizeMode: "cover",
  },

  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginTop: 12,
  },

  cardSubtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
});