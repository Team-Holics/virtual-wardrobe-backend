import { createContext, ReactNode, useContext, useState } from "react";

export type WardrobeItem = {
  id: string;
  name: string;
  type: string; // Tops | Bottoms | Dresses | Shoes | Accessories
  image: any; // require()'d asset or { uri: string }
  brand?: string;
  color?: string;
  pattern?: string;
  material?: string;
  seasons?: string[]; // e.g. ["Spring", "Summer"]
};

export type WishlistItem = {
  id: string;
  name: string;
  brand: string;
  source: string;
  price: string;
  imageUri?: string; // a photo taken/picked by the user (camera or library)
  image?: any; // a local bundled asset, e.g. require("../../assets/images/x.jpg")
};

export type ProfileData = {
  height: string;
  weight: string;
  chest: string;
  waist: string;
  hip: string;
  shoulderWidth: string;
  styles: string[];
};

export type OutfitItem = {
  id: string;
  name: string;
  image: any;
};

export type AppDataContextType = {
  wardrobeItems: WardrobeItem[];
  addToWardrobe: (item: Omit<WardrobeItem, "id">) => void;
  removeFromWardrobe: (id: string) => void;

  wishlistItems: WishlistItem[];
  addToWishlist: (item: Omit<WishlistItem, "id">) => string;
  removeFromWishlist: (id: string) => void;

  profile: ProfileData;
  updateProfile: (profile: ProfileData) => void;

  outfitItems: OutfitItem[];
  isOutfitSaved: (id: string) => boolean;
  toggleOutfitItem: (item: OutfitItem) => void;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const INITIAL_WARDROBE: WardrobeItem[] = [
  {
    id: "w1",
    name: "White Shirt",
    type: "Tops",
    image: require("../../assets/images/look1.jpg"),
    brand: "Uniqlo",
    color: "White",
    pattern: "Solid",
    material: "Cotton",
    seasons: ["Spring", "Summer"],
  },
  {
    id: "w2",
    name: "Blue Jeans",
    type: "Bottoms",
    image: require("../../assets/images/look2.jpg"),
    brand: "Levi's",
    color: "Blue",
    pattern: "Solid",
    material: "Denim",
    seasons: ["Fall", "Winter"],
  },
  {
    id: "w3",
    name: "Black Dress",
    type: "Dresses",
    image: require("../../assets/images/look3.jpg"),
    brand: "Zara",
    color: "Black",
    pattern: "Solid",
    material: "Polyester",
    seasons: ["Fall", "Winter"],
  },
  {
    id: "w4",
    name: "Sneakers",
    type: "Shoes",
    image: require("../../assets/images/look4.jpg"),
    brand: "Nike",
    color: "White",
    pattern: "Solid",
    material: "Canvas",
    seasons: ["Spring", "Summer", "Fall"],
  },
];

const INITIAL_WISHLIST: WishlistItem[] = [
  { id: "wl1", name: "Tailored Black Blazer", brand: "COS", source: "Zara", price: "128" },
  { id: "wl2", name: "Structured Leather Bag", brand: "Mansur Gavriel", source: "Nordstrom", price: "245" },
  { id: "wl3", name: "Minimal White Sneakers", brand: "Common Projects", source: "SSENSE", price: "390" },
  { id: "wl4", name: "Satin Midi Skirt", brand: "Reformation", source: "Revolve", price: "168" },
];

const INITIAL_PROFILE: ProfileData = {
  height: "5'10\"",
  weight: "165 lb",
  chest: "",
  waist: "",
  hip: "",
  shoulderWidth: "",
  styles: ["Casual", "Formal"],
};

// Seeded with the same items Home's "Recently Outfit" section shows —
// these appear in Wardrobe's Outfit tab automatically, no heart tap needed
const INITIAL_OUTFITS: OutfitItem[] = [
  { id: "r1", name: "Beige Hoodie", image: require("../../assets/images/shirt2.jpg") },
  { id: "r2", name: "Black Jeans", image: require("../../assets/images/shirt3.jpg") },
  { id: "r3", name: "Sneakers", image: require("../../assets/images/shoe1.jpg") },
];

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>(INITIAL_WARDROBE);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(INITIAL_WISHLIST);
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE);
  const [outfitItems, setOutfitItems] = useState<OutfitItem[]>(INITIAL_OUTFITS);

  const addToWardrobe = (item: Omit<WardrobeItem, "id">) => {
    setWardrobeItems((prev) => [{ ...item, id: Date.now().toString() }, ...prev]);
  };
  const removeFromWardrobe = (id: string) => {
    setWardrobeItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addToWishlist = (item: Omit<WishlistItem, "id">) => {
    const newId = Date.now().toString();
    setWishlistItems((prev) => [{ ...item, id: newId }, ...prev]);
    return newId;
  };
  const removeFromWishlist = (id: string) => {
    setWishlistItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateProfile = (newProfile: ProfileData) => {
    setProfile(newProfile);
  };

  const isOutfitSaved = (id: string) => outfitItems.some((item) => item.id === id);

  const toggleOutfitItem = (item: OutfitItem) => {
    setOutfitItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [item, ...prev]
    );
  };

  return (
    <AppDataContext.Provider
      value={{
        wardrobeItems,
        addToWardrobe,
        removeFromWardrobe,
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        profile,
        updateProfile,
        outfitItems,
        isOutfitSaved,
        toggleOutfitItem,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
