import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export default function CardPreview({ clientName = "NOMBRE APELLIDO" }) {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>

        <View style={styles.logoContainer}>
          <Image 
            source={require("../../assets/hans-logo.png")} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>


        <View style={styles.nameContainer}>
          <Text style={styles.cardHolderName}>{clientName.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 0,
    marginBottom: 32,
    width: "100%",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    minWidth: 280,
    aspectRatio: 1.58,
    backgroundColor: "#3a3a3a",
    borderRadius: 16,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  logo: {
    width: 120,
    height: 120,
  },
  nameContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 16,
  },
  cardHolderName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e0e0e0",
    letterSpacing: 2,
    textAlign: "center",
  },
});
