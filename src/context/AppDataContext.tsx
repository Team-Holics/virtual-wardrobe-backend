import { createContext, ReactNode, useContext, useState } from "react";

export type WardrobeItem = {
  id: string;
  name: string;
  type: string; // Tops | Bottoms | Dresses | Shoes | Accessories
  image: any; // require()'d asset or { uri: string }
};

export type WishlistItem = {
  id: string;
  name: string;
  brand: string;
  source: string;
  price: string;
  imageUri?: string;
};

type AppDataContextType = {
  wardrobeItems: WardrobeItem[];
  addToWardrobe: (item: Omit<WardrobeItem, "id">) => void;
  removeFromWardrobe: (id: string) => void;

  wishlistItems: WishlistItem[];
  addToWishlist: (item: Omit<WishlistItem, "id">) => void;
  removeFromWishlist: (id: string) => void;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Starting data — same items your screens already had hardcoded.
// Once your friend's backend is ready, these arrays get replaced by
// data fetched from the server instead of starting empty/hardcoded.
const INITIAL_WARDROBE: WardrobeItem[] = [
  { id: "w1", name: "White Shirt", type: "Tops", image: require("../../assets/images/look1.jpg") },
  { id: "w2", name: "Blue Jeans", type: "Bottoms", image: require("../../assets/images/look2.jpg") },
  { id: "w3", name: "Black Dress", type: "Dresses", image: require("../../assets/images/look3.jpg") },
  { id: "w4", name: "Sneakers", type: "Shoes", image: require("../../assets/images/look4.jpg") },
];

const INITIAL_WISHLIST: WishlistItem[] = [
  { id: "wl1", name: "Tailored Black Blazer", brand: "COS", source: "Zara", price: "128" },
  { id: "wl2", name: "Structured Leather Bag", brand: "Mansur Gavriel", source: "Nordstrom", price: "245" },
  { id: "wl3", name: "Minimal White Sneakers", brand: "Common Projects", source: "SSENSE", price: "390" },
  { id: "wl4", name: "Satin Midi Skirt", brand: "Reformation", source: "Revolve", price: "168" },
];

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>(INITIAL_WARDROBE);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(INITIAL_WISHLIST);

  const addToWardrobe = (item: Omit<WardrobeItem, "id">) => {
    setWardrobeItems((prev) => [{ ...item, id: Date.now().toString() }, ...prev]);
  };
  const removeFromWardrobe = (id: string) => {
    setWardrobeItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addToWishlist = (item: Omit<WishlistItem, "id">) => {
    setWishlistItems((prev) => [{ ...item, id: Date.now().toString() }, ...prev]);
  };
  const removeFromWishlist = (id: string) => {
    setWishlistItems((prev) => prev.filter((i) => i.id !== id));
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
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

// Import this hook in any screen that needs to read or update the shared lists
export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
