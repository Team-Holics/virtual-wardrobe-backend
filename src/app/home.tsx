import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../../src/app/BottomTabBar";

export default function HomeScreen() {
  return (
      <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>

          <View>
            <Text style={styles.greeting}>Good Morning 👋</Text>
            <Text style={styles.name}>Sophia</Text>
          </View>

          <Image
            source={require("../../assets/images/avatar.png")}
            style={styles.avatar}
          />

        </View>

        {/* Search */}

        <TextInput
          placeholder="Search clothes..."
          placeholderTextColor="#999"
          style={styles.search}
        />

        {/* AI Stylist */}

        <View style={styles.aiCard}>

          <Text style={styles.aiTitle}>
            🤖 AI Fashion Assistant
          </Text>

          <Text style={styles.aiSubtitle}>
            Here are today's outfit suggestions based on
            your wardrobe and style.
          </Text>

          <TouchableOpacity style={styles.aiButton}>
            <Text style={styles.aiButtonText}>
              Generate Outfit
            </Text>
          </TouchableOpacity>

        </View>

        {/* Categories */}

        <Text style={styles.sectionTitle}>
          Categories
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >

          <TouchableOpacity style={styles.category}>
            <Text style={styles.categoryText}>👕 Tops</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.category}>
            <Text style={styles.categoryText}>👖 Bottoms</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.category}>
            <Text style={styles.categoryText}>👗 Dresses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.category}>
            <Text style={styles.categoryText}>👟 Shoes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.category}>
            <Text style={styles.categoryText}>👜 Bags</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* Today's Recommendation */}

        <Text style={styles.sectionTitle}>
          Today's Recommendation
        </Text>

        <View style={styles.recommendCard}>

          <Image
            source={require("../../assets/images/shirt1.jpg")}
            style={styles.recommendImage}
          />

          <View style={{ flex: 1 }}>

            <Text style={styles.itemName}>
              White Oversized Shirt
            </Text>

            <Text style={styles.itemType}>
              Casual • Summer
            </Text>

            <TouchableOpacity style={styles.tryButton}>
              <Text style={styles.tryButtonText}>
                Try On
              </Text>
            </TouchableOpacity>

          </View>

        </View>
        {/* Recently Viewed */}

<Text style={styles.sectionTitle}>
  Recently Viewed
</Text>

<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
>

  <View style={styles.smallCard}>

    <Image
      source={require("../../assets/images/shirt2.jpg")}
      style={styles.smallImage}
    />

    <Text style={styles.smallTitle}>
      Beige Hoodie
    </Text>

  </View>

  <View style={styles.smallCard}>

    <Image
      source={require("../../assets/images/shirt3.jpg")}
      style={styles.smallImage}
    />

    <Text style={styles.smallTitle}>
      Black Jeans
    </Text>

  </View>

  <View style={styles.smallCard}>

    <Image
      source={require("../../assets/images/shoe1.jpg")}
      style={styles.smallImage}
    />

    <Text style={styles.smallTitle}>
      Sneakers
    </Text>

  </View>

</ScrollView>

{/* Trending */}

<Text style={styles.sectionTitle}>
  Trending Now
</Text>

<View style={styles.trendingCard}>

  <Image
    source={require("../../assets/images/shirt3.jpg")}
    style={styles.trendingImage}
  />

  <View style={{flex:1}}>

    <Text style={styles.itemName}>
      Summer Outfit
    </Text>

    <Text style={styles.itemType}>
      AI Confidence 97%
    </Text>

    <TouchableOpacity
      style={styles.tryButton}
    >
      <Text style={styles.tryButtonText}>
        View Details
      </Text>
    </TouchableOpacity>

  </View>

</View>

<View style={{height:120}} />
      </ScrollView>
      <BottomTabBar active="home" />
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFF8FB",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },

  greeting: {
    fontSize: 18,
    color: "#777",
  },

  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8C4D5A",
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  search: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 50,
    marginBottom: 25,
  },

  aiCard: {
    backgroundColor: "#F7DDE7",
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 20,
  },

  aiTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#8C4D5A",
  },

  aiSubtitle: {
    marginTop: 10,
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },

  aiButton: {
    marginTop: 20,
    backgroundColor: "#8C4D5A",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },

  aiButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  sectionTitle: {
    marginTop: 30,
    marginLeft: 20,
    fontSize: 22,
    fontWeight: "bold",
    color: "#8C4D5A",
  },

  category: {
    backgroundColor: "#fff",
    marginLeft: 20,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 2,
  },

  categoryText: {
    fontWeight: "600",
  },

  recommendCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 20,
    padding: 15,
    elevation: 3,
  },

  recommendImage: {
    width: 120,
    height: 140,
    borderRadius: 15,
    marginRight: 15,
  },

  itemName: {
    fontSize: 18,
    fontWeight: "bold",
  },

  itemType: {
    marginTop: 10,
    color: "#777",
  },

  tryButton: {
    marginTop: 20,
    backgroundColor: "#8C4D5A",
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
  },

  tryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  smallCard:{
    backgroundColor:"#fff",
    width:140,
    marginLeft:20,
    marginTop:20,
    borderRadius:20,
    padding:10,
    alignItems:"center",
  },

  smallImage:{
    width:110,
    height:120,
    borderRadius:15,
  },

  smallTitle:{
    marginTop:10,
    fontWeight:"600",
  },

  trendingCard:{
    flexDirection:"row",
    backgroundColor:"#fff",
    margin:20,
    borderRadius:20,
    padding:15,
    elevation:3,
  },

  trendingImage:{
    width:120,
    height:150,
    borderRadius:15,
    marginRight:15,
  },
  
});