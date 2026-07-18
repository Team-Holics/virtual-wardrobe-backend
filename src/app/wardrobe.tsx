import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import BottomTabBar from "../../src/app/BottomTabBar";

export default function WardrobeScreen() {

  const categories = [
    "All",
    "Tops",
    "Bottoms",
    "Dresses",
    "Shoes",
    "Accessories"
  ];


  const clothes = [
    {
      name:"White Shirt",
      type:"Top",
      image: require("../../assets/images/look1.jpg")
    },
    {
      name:"Blue Jeans",
      type:"Bottom",
      image: require("../../assets/images/look2.jpg")
    },
    {
      name:"Black Dress",
      type:"Dress",
      image: require("../../assets/images/look3.jpg")
    },
    {
      name:"Sneakers",
      type:"Shoes",
      image: require("../../assets/images/look4.jpg")
    },
  ];


  return (

    <View style={styles.container}>


      {/* Header */}

      <View style={styles.header}>

        <Text style={styles.title}>
          My Wardrobe
        </Text>


        <TouchableOpacity style={styles.addButton}>

          <Text style={styles.addText}>
            +
          </Text>

        </TouchableOpacity>


      </View>



      {/* Category */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >

        {
          categories.map((item,index)=>(

            <TouchableOpacity
              key={index}
              style={[
                styles.category,
                index===0 && styles.activeCategory
              ]}
            >

              <Text
              style={[
                styles.categoryText,
                index===0 && styles.activeText
              ]}
              >
                {item}
              </Text>


            </TouchableOpacity>

          ))
        }

      </ScrollView>




      {/* Clothes Grid */}

      <ScrollView
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.grid}>


        {
          clothes.map((item,index)=>(

            <TouchableOpacity
              key={index}
              style={styles.card}
            >

              <Image
                source={item.image}
                style={styles.clothImage}
              />


              <Text style={styles.name}>
                {item.name}
              </Text>


              <Text style={styles.type}>
                {item.type}
              </Text>


            </TouchableOpacity>


          ))
        }


        </View>


      </ScrollView>

    <BottomTabBar active="upload" />

    </View>

  );
}



const styles = StyleSheet.create({

container:{
  flex:1,
  backgroundColor:"#FFF8FA",
  paddingHorizontal:20,
  paddingTop:50,
},


header:{
  flexDirection:"row",
  justifyContent:"space-between",
  alignItems:"center",
},


title:{
  fontSize:28,
  fontWeight:"700",
  color:"#222",
},


addButton:{
  width:45,
  height:45,
  borderRadius:23,
  backgroundColor:"#F48FB1",
  justifyContent:"center",
  alignItems:"center",
},


addText:{
  color:"#fff",
  fontSize:30,
  marginTop:-3,
},



categoryContainer:{
  marginTop:25,
},


category:{
  paddingHorizontal:18,
  paddingVertical:10,
  backgroundColor:"#fff",
  borderRadius:20,
  marginRight:10,
},


activeCategory:{
  backgroundColor:"#F48FB1",
},


categoryText:{
  color:"#777",
  fontSize:14,
},


activeText:{
  color:"#fff",
},



grid:{
  flexDirection:"row",
  flexWrap:"wrap",
  justifyContent:"space-between",
  marginTop:25,
},


card:{
  width:"47%",
  backgroundColor:"#fff",
  borderRadius:20,
  padding:12,
  marginBottom:20,
},


clothImage:{
  width:"100%",
  height:170,
  borderRadius:15,
  resizeMode:"cover",
},


name:{
  fontSize:16,
  fontWeight:"600",
  marginTop:10,
},


type:{
  color:"#999",
  marginTop:4,
},


});