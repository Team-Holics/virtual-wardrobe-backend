import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useRef, useState } from "react";

import {
  Alert,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://127.0.0.1:3000";

const CATEGORIES = [
  "All",
  "Tops",
  "Bottoms",
  "Dresses",
  "Shoes",
  "Outerwear",
] as const;

type ClothingCategory =
  | "Tops"
  | "Bottoms"
  | "Dresses"
  | "Shoes"
  | "Outerwear";

type FilterCategory = "All" | ClothingCategory;

type SourcePanel = "saved" | "wishlist" | "wardrobe" | null;

type SourceType = "wardrobe" | "wishlist" | "upload";

type WardrobeItem = {
  item_id: number;
  item_name: string;
  category?: string | null;
  sub_category?: string | null;
  brand?: string | null;
  color?: string | null;
  image_url?: string | null;
};

type WishlistItem = {
  wishlist_id: number;
  item_name: string;
  brand?: string | null;
  source?: string | null;
  price?: string | number | null;
  image_url?: string | null;
  ai_category?: string | null;
};

type SelectedItem = {
  tryon_selected_item_id: number;
  session_id: number;
  source_type: SourceType;
  source_item_id?: number | null;
  category: ClothingCategory;
  item_name?: string | null;
  image_url?: string | null;
};

type SavedOutfit = {
  saved_outfit_id: number;
  user_id: number;
  recommendation_id: string;
  outfit_name: string;
  image_key?: string | null;
  created_at?: string | null;
};

const SAVED_OUTFIT_IMAGES: Record<string, ImageSourcePropType> = {
  c1: require("../../assets/images/shirt1.jpg"),
  c2: require("../../assets/images/look1.jpg"),
  d1: require("../../assets/images/look3.jpg"),
  d2: require("../../assets/images/shirt2.jpg"),
  w1: require("../../assets/images/look2.jpg"),
  w2: require("../../assets/images/shirt3.jpg"),
  p1: require("../../assets/images/look4.jpg"),
  p2: require("../../assets/images/shoe1.jpg"),
  shirt1: require("../../assets/images/shirt1.jpg"),
  "shirt1.jpg": require("../../assets/images/shirt1.jpg"),
  look1: require("../../assets/images/look1.jpg"),
  "look1.jpg": require("../../assets/images/look1.jpg"),
  look2: require("../../assets/images/look2.jpg"),
  "look2.jpg": require("../../assets/images/look2.jpg"),
  look3: require("../../assets/images/look3.jpg"),
  "look3.jpg": require("../../assets/images/look3.jpg"),
  look4: require("../../assets/images/look4.jpg"),
  "look4.jpg": require("../../assets/images/look4.jpg"),
  shirt2: require("../../assets/images/shirt2.jpg"),
  "shirt2.jpg": require("../../assets/images/shirt2.jpg"),
  shirt3: require("../../assets/images/shirt3.jpg"),
  "shirt3.jpg": require("../../assets/images/shirt3.jpg"),
  shoe1: require("../../assets/images/shoe1.jpg"),
  "shoe1.jpg": require("../../assets/images/shoe1.jpg"),
};

export default function TryOnScreen() {
  const router = useRouter();

  const [activeSource, setActiveSource] =
    useState<SourcePanel>("wardrobe");

  const [wardrobeFilter, setWardrobeFilter] =
    useState<FilterCategory>("All");

  const [wishlistFilter, setWishlistFilter] =
    useState<FilterCategory>("All");

  const [wardrobeItems, setWardrobeItems] =
    useState<WardrobeItem[]>([]);

  const [wishlistItems, setWishlistItems] =
    useState<WishlistItem[]>([]);

  const [savedOutfits, setSavedOutfits] =
    useState<SavedOutfit[]>([]);

  const [savedOutfitPreview, setSavedOutfitPreview] =
    useState<ImageSourcePropType | null>(null);

  const [selectedSavedOutfitId, setSelectedSavedOutfitId] =
    useState<number | null>(null);

  const [currentSessionId, setCurrentSessionId] =
    useState<number | null>(null);

  // Keep the active session available immediately across async taps.
  // React state updates are asynchronous, so using a ref here prevents
  // Wardrobe/Wishlist selections from accidentally creating separate sessions.
  const currentSessionIdRef = useRef<number | null>(null);
  const sessionCreationPromiseRef =
    useRef<Promise<number | null> | null>(null);

  // Serialize add/remove requests so fast taps are not dropped and
  // backend mutations happen in the exact order the user tapped them.
  const selectionMutationQueueRef =
    useRef<Promise<void>>(Promise.resolve());

  const [selectedItems, setSelectedItems] =
    useState<SelectedItem[]>([]);

  const [tryOnResultImage, setTryOnResultImage] =
    useState<string | null>(null);

  const [pickedImage, setPickedImage] =
    useState<string | null>(null);

  const [currentIsSaved, setCurrentIsSaved] =
    useState(false);

  const [viewingSavedSession, setViewingSavedSession] =
    useState(false);

  const [wardrobeLoading, setWardrobeLoading] =
    useState(true);

  const [wishlistLoading, setWishlistLoading] =
    useState(true);

  const [savedLoading, setSavedLoading] =
    useState(true);

  const [creatingSession, setCreatingSession] =
    useState(false);

  const [changingSelection, setChangingSelection] =
    useState(false);

  const [checkingResult, setCheckingResult] =
    useState(false);

  const [savingOutfit, setSavingOutfit] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  // =========================================================
  // HELPERS
  // =========================================================

  const getToken = async () => {
    return SecureStore.getItemAsync("authToken");
  };

  const isRemoteImage = (url?: string | null) => {
    if (!url) return false;

    return (
      url.startsWith("http://") ||
      url.startsWith("https://")
    );
  };

  const normalizeCategory = (
    value?: string | null
  ): ClothingCategory | null => {
    if (!value) return null;

    const text = value.trim().toLowerCase();

    if (
      text === "top" ||
      text === "tops" ||
      text.includes("shirt") ||
      text.includes("t-shirt") ||
      text.includes("blouse") ||
      text.includes("hoodie") ||
      text.includes("polo")
    ) {
      return "Tops";
    }

    if (
      text === "bottom" ||
      text === "bottoms" ||
      text.includes("pants") ||
      text.includes("trousers") ||
      text.includes("jeans") ||
      text.includes("shorts") ||
      text.includes("skirt")
    ) {
      return "Bottoms";
    }

    if (
      text === "dress" ||
      text === "dresses" ||
      text.includes("dress")
    ) {
      return "Dresses";
    }

    if (
      text === "shoe" ||
      text === "shoes" ||
      text.includes("sneaker") ||
      text.includes("boot") ||
      text.includes("heel")
    ) {
      return "Shoes";
    }

    if (
      text === "outerwear" ||
      text === "outwear" ||
      text.includes("jacket") ||
      text.includes("coat") ||
      text.includes("blazer")
    ) {
      return "Outerwear";
    }

    return null;
  };

  const getWardrobeCategory = (item: WardrobeItem) => {
    return (
      normalizeCategory(item.category) ||
      normalizeCategory(item.sub_category)
    );
  };

  const getWishlistCategory = (item: WishlistItem) => {
    return normalizeCategory(item.ai_category);
  };

  const selectedCategoryExists = (
    category: ClothingCategory
  ) => {
    return selectedItems.some(
      (item) => item.category === category
    );
  };

  const isCategoryCompatible = (
    category: ClothingCategory
  ) => {
    const hasDress = selectedCategoryExists("Dresses");
    const hasTop = selectedCategoryExists("Tops");
    const hasBottom = selectedCategoryExists("Bottoms");

    if (category === "Dresses") {
      if (hasTop || hasBottom) {
        return false;
      }
    }

    if (
      category === "Tops" ||
      category === "Bottoms"
    ) {
      if (hasDress) {
        return false;
      }
    }

    return true;
  };

  const isWardrobeItemSelected = (
    item: WardrobeItem
  ) => {
    return selectedItems.some(
      (selected) =>
        selected.source_type === "wardrobe" &&
        selected.source_item_id === item.item_id
    );
  };

  const isWishlistItemSelected = (
    item: WishlistItem
  ) => {
    return selectedItems.some(
      (selected) =>
        selected.source_type === "wishlist" &&
        selected.source_item_id === item.wishlist_id
    );
  };

  const isCategoryUnavailable = (
    category: ClothingCategory | null,
    isCurrentlySelected: boolean
  ) => {
    if (!category) {
      return true;
    }

    if (isCurrentlySelected) {
      return false;
    }

    if (selectedCategoryExists(category)) {
      return true;
    }

    return !isCategoryCompatible(category);
  };

  const clearGeneratedResult = () => {
    setTryOnResultImage(null);
    setCurrentIsSaved(false);
  };

  // =========================================================
  // SESSION
  // =========================================================

  const createSession = async (): Promise<number | null> => {
    try {
      setCreatingSession(true);

      const token = await getToken();

      if (!token) {
        Alert.alert(
          "Login Required",
          "Please log in again."
        );

        return null;
      }

      const response = await fetch(
        `${API_URL}/api/tryon`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Try-On Error",
          data?.error ||
          "Could not create try-on session."
        );

        return null;
      }

      const sessionId = data?.session?.session_id;

      if (!sessionId) {
        return null;
      }

      // Update the ref before React re-renders so another quick tap
      // immediately reuses this exact same session.
      currentSessionIdRef.current = sessionId;
      setCurrentSessionId(sessionId);

      setSelectedItems([]);
      setTryOnResultImage(null);
      setCurrentIsSaved(false);
      setViewingSavedSession(false);

      return sessionId;
    } catch (error) {
      console.error("Create session error:", error);

      Alert.alert(
        "Connection Error",
        "Could not create the try-on session."
      );

      return null;
    } finally {
      setCreatingSession(false);
    }
  };

  const ensureSession = async (): Promise<number | null> => {
    // Reuse the active clothing-selection session.
    if (
      currentSessionIdRef.current &&
      !viewingSavedSession
    ) {
      return currentSessionIdRef.current;
    }

    // If two taps happen before the first POST finishes, both await
    // the same promise instead of creating two separate sessions.
    if (sessionCreationPromiseRef.current) {
      return sessionCreationPromiseRef.current;
    }

    const creationPromise = createSession();
    sessionCreationPromiseRef.current = creationPromise;

    try {
      return await creationPromise;
    } finally {
      sessionCreationPromiseRef.current = null;
    }
  };

  // =========================================================
  // LOAD WARDROBE
  // =========================================================

  const loadWardrobe = useCallback(async () => {
    try {
      setWardrobeLoading(true);

      const token = await getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/wardrobe`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      setWardrobeItems(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error("Wardrobe load error:", error);
    } finally {
      setWardrobeLoading(false);
    }
  }, [router]);

  // =========================================================
  // LOAD WISHLIST
  // =========================================================

  const loadWishlist = useCallback(async () => {
    try {
      setWishlistLoading(true);

      const token = await getToken();

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_URL}/api/wishlist`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      setWishlistItems(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error("Wishlist load error:", error);
    } finally {
      setWishlistLoading(false);
    }
  }, []);

  // =========================================================
  // LOAD HOME SAVED OUTFITS
  // =========================================================

  const loadSavedOutfits = useCallback(async () => {
    try {
      setSavedLoading(true);

      const token = await getToken();

      if (!token) {
        setSavedOutfits([]);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/saved-outfits`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Saved outfits API error:", data);
        setSavedOutfits([]);
        return;
      }

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.saved_outfits)
          ? data.saved_outfits
          : [];

      setSavedOutfits(rows);
    } catch (error) {
      console.error("Saved outfits load error:", error);
      setSavedOutfits([]);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWardrobe();
      loadWishlist();
      loadSavedOutfits();
    }, [
      loadWardrobe,
      loadWishlist,
      loadSavedOutfits,
    ])
  );

  // =========================================================
  // ADD ITEM
  // =========================================================

  const addSelectedItem = async ({
    sourceType,
    sourceItemId,
    category,
    itemName,
    imageUrl,
  }: {
    sourceType: "wardrobe" | "wishlist";
    sourceItemId: number;
    category: ClothingCategory;
    itemName: string;
    imageUrl?: string | null;
  }) => {
    if (selectedSavedOutfitId !== null) {
      return;
    }

    setSavedOutfitPreview(null);

    const mutation = async () => {
      try {
        setChangingSelection(true);

        const sessionId = await ensureSession();

        if (!sessionId) {
          return;
        }

        const token = await getToken();

        if (!token) return;

        const response = await fetch(
          `${API_URL}/api/tryon/${sessionId}/items`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              source_type: sourceType,
              source_item_id: sourceItemId,
              category,
              item_name: itemName,
              image_url: imageUrl || null,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          Alert.alert(
            "Cannot Select Item",
            data?.error ||
            "This item cannot be added."
          );

          return;
        }

        // Prevent duplicate local entries if the same response is observed twice.
        setSelectedItems((previous) => {
          const withoutSameCategory = previous.filter(
            (item) => item.category !== category
          );

          return [
            ...withoutSameCategory,
            data.item,
          ];
        });

        clearGeneratedResult();
      } catch (error) {
        console.error("Add selected item error:", error);

        Alert.alert(
          "Selection Error",
          "Could not add this item."
        );
      } finally {
        setChangingSelection(false);
      }
    };

    const queued = selectionMutationQueueRef.current.then(
      mutation,
      mutation
    );

    selectionMutationQueueRef.current = queued.catch(
      () => undefined
    );

    await queued;
  };

  // =========================================================
  // REMOVE ITEM
  // =========================================================

  const removeSelectedCategory = async (
    category: ClothingCategory
  ) => {
    const mutation = async () => {
      const sessionId =
        currentSessionIdRef.current ||
        currentSessionId;

      if (!sessionId) {
        return;
      }

      try {
        setChangingSelection(true);

        const token = await getToken();

        if (!token) return;

        const response = await fetch(
          `${API_URL}/api/tryon/${sessionId}/items/${encodeURIComponent(
            category
          )}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          Alert.alert(
            "Remove Failed",
            data?.error ||
            "Could not remove this item."
          );

          return;
        }

        setSelectedItems((previous) =>
          previous.filter(
            (item) => item.category !== category
          )
        );

        clearGeneratedResult();
      } catch (error) {
        console.error("Remove item error:", error);

        Alert.alert(
          "Remove Failed",
          "Could not remove this item."
        );
      } finally {
        setChangingSelection(false);
      }
    };

    const queued = selectionMutationQueueRef.current.then(
      mutation,
      mutation
    );

    selectionMutationQueueRef.current = queued.catch(
      () => undefined
    );

    await queued;
  };

  // =========================================================
  // WARDROBE PRESS
  // =========================================================

  const handleWardrobeItemPress = async (
    item: WardrobeItem
  ) => {
    const category = getWardrobeCategory(item);

    if (!category) {
      Alert.alert(
        "Category Required",
        "This wardrobe item does not have a supported try-on category."
      );

      return;
    }

    const selected =
      isWardrobeItemSelected(item);

    if (selected) {
      await removeSelectedCategory(category);
      return;
    }

    if (
      isCategoryUnavailable(
        category,
        false
      )
    ) {
      return;
    }

    await addSelectedItem({
      sourceType: "wardrobe",
      sourceItemId: item.item_id,
      category,
      itemName: item.item_name,
      imageUrl: item.image_url,
    });
  };

  // =========================================================
  // WISHLIST PRESS
  // =========================================================

  const handleWishlistItemPress = async (
    item: WishlistItem
  ) => {
    const category = getWishlistCategory(item);

    if (!category) {
      Alert.alert(
        "Category Not Ready",
        "This wishlist item has not been categorized by AI yet."
      );

      return;
    }

    const selected =
      isWishlistItemSelected(item);

    if (selected) {
      await removeSelectedCategory(category);
      return;
    }

    if (
      isCategoryUnavailable(
        category,
        false
      )
    ) {
      return;
    }

    await addSelectedItem({
      sourceType: "wishlist",
      sourceItemId: item.wishlist_id,
      category,
      itemName: item.item_name,
      imageUrl: item.image_url,
    });
  };

  // =========================================================
  // FILTERING
  // =========================================================

  const filteredWardrobeItems =
    wardrobeItems.filter((item) => {
      if (wardrobeFilter === "All") {
        return true;
      }

      return (
        getWardrobeCategory(item) ===
        wardrobeFilter
      );
    });

  const filteredWishlistItems =
    wishlistItems.filter((item) => {
      if (wishlistFilter === "All") {
        return true;
      }

      return (
        getWishlistCategory(item) ===
        wishlistFilter
      );
    });

  // =========================================================
  // TRY ON / CHECK RESULT
  // =========================================================

  const handleCheckResult = async () => {
    if (!currentSessionId) {
      Alert.alert(
        "No Outfit Selected",
        "Select clothing first."
      );

      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert(
        "No Outfit Selected",
        "Select at least one clothing item."
      );

      return;
    }

    try {
      setCheckingResult(true);

      const token = await getToken();

      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/tryon/${currentSessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Try-On Failed",
          data?.error ||
          "Could not check the result."
        );

        return;
      }

      if (!data.result_image) {
        Alert.alert(
          "Still Processing",
          "The virtual try-on result is not ready yet."
        );

        return;
      }

      setTryOnResultImage(data.result_image);
      setCurrentIsSaved(
        Boolean(data.is_saved)
      );

      if (
        Array.isArray(
          data.selected_items
        )
      ) {
        setSelectedItems(
          data.selected_items
        );
      }
    } catch (error) {
      console.error(
        "Check result error:",
        error
      );

      Alert.alert(
        "Try-On Failed",
        "Could not connect to the server."
      );
    } finally {
      setCheckingResult(false);
    }
  };

  // =========================================================
  // SAVE RESULT
  // =========================================================

  const handleSaveTryOn = async () => {
    if (
      !currentSessionId ||
      !tryOnResultImage
    ) {
      Alert.alert(
        "Try-On Not Ready",
        "Complete the virtual try-on before saving."
      );

      return;
    }

    try {
      setSavingOutfit(true);

      const token = await getToken();

      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/tryon/${currentSessionId}/save`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Save Failed",
          data?.error ||
          "Could not save this outfit."
        );

        return;
      }

      setCurrentIsSaved(true);

      await loadSavedOutfits();

      Alert.alert(
        "Saved",
        "Your virtual try-on outfit has been saved."
      );
    } catch (error) {
      console.error(
        "Save try-on error:",
        error
      );

      Alert.alert(
        "Save Failed",
        "Could not connect to the server."
      );
    } finally {
      setSavingOutfit(false);
    }
  };

  // =========================================================
  // HOME SAVED OUTFIT PREVIEW
  // =========================================================

  const getSavedOutfitImage = (item: SavedOutfit) => {
    const imageKey = item.image_key?.trim();

    if (imageKey && SAVED_OUTFIT_IMAGES[imageKey]) {
      return SAVED_OUTFIT_IMAGES[imageKey];
    }

    return SAVED_OUTFIT_IMAGES[item.recommendation_id] || null;
  };

  const handleSavedOutfitPress = async (item: SavedOutfit) => {
    const image = getSavedOutfitImage(item);

    if (!image) {
      Alert.alert(
        "Image unavailable",
        "This saved outfit does not have a matching recommendation image."
      );
      return;
    }

    // Tapping the selected saved outfit again deselects it and restores
    // Wardrobe, Wishlist and Camera availability.
    if (selectedSavedOutfitId === item.saved_outfit_id) {
      setSelectedSavedOutfitId(null);
      setSavedOutfitPreview(null);
      setCurrentIsSaved(false);
      return;
    }

    // A saved outfit is a complete outfit. It must be exclusive, so clear
    // any individual Wardrobe/Wishlist selections from the active session.
    const categoriesToRemove = Array.from(
      new Set(selectedItems.map((selected) => selected.category))
    );

    for (const category of categoriesToRemove) {
      await removeSelectedCategory(category);
    }

    setSelectedItems([]);
    setSelectedSavedOutfitId(item.saved_outfit_id);
    setSavedOutfitPreview(image);
    setTryOnResultImage(null);
    setPickedImage(null);
    setCurrentIsSaved(false);
    setViewingSavedSession(false);
    setActiveSource("saved");
  };

  // =========================================================
  // IMAGE UPLOAD
  // =========================================================

  const uploadTryOnImage = async (
    localUri: string
  ): Promise<string | null> => {
    try {
      setUploadingImage(true);

      const token = await getToken();

      if (!token) return null;

      const filename =
        localUri.split("/").pop() ||
        `tryon-${Date.now()}.jpg`;

      const formData = new FormData();

      formData.append(
        "image",
        {
          uri: localUri,
          name: filename,
          type: "image/jpeg",
        } as any
      );

      const response = await fetch(
        `${API_URL}/api/upload/tryon`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Upload Failed",
          data?.error ||
          "Could not upload the image."
        );

        return null;
      }

      return (
        data?.url ||
        data?.image_url ||
        data?.publicUrl ||
        data?.public_url ||
        null
      );
    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const processUploadedImage = async (
    localUri: string
  ) => {
    setSavedOutfitPreview(null);
      setPickedImage(localUri);
    setTryOnResultImage(null);
    setActiveSource(null);

    const uploadedUrl =
      await uploadTryOnImage(localUri);

    if (uploadedUrl) {
      setPickedImage(uploadedUrl);
    }
  };

  const handleTakePhoto = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Camera permission is required."
      );

      return;
    }

    const result =
      await ImagePicker.launchCameraAsync({
        quality: 0.7,
      });

    if (result.canceled) return;

    await processUploadedImage(
      result.assets[0].uri
    );
  };

  const handleChoosePhoto = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Photo library permission is required."
      );

      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

    if (result.canceled) return;

    await processUploadedImage(
      result.assets[0].uri
    );
  };

  const handleUploadPress = () => {
    Alert.alert(
      "Upload Photo",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: handleTakePhoto,
        },
        {
          text: "Choose from Library",
          onPress: handleChoosePhoto,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  // =========================================================
  // SOURCE PANEL
  // =========================================================

  const toggleSource = (
    source: SourcePanel
  ) => {
    setActiveSource((previous) =>
      previous === source
        ? null
        : source
    );
  };

  const isBusy =
    changingSelection ||
    creatingSession ||
    checkingResult ||
    savingOutfit ||
    uploadingImage;

  const savedOutfitLocked =
    selectedSavedOutfitId !== null;

  // =========================================================
  // UI
  // =========================================================

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color="#374151"
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Virtual Try-On
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* PREVIEW */}

        <View style={styles.stage}>
          {tryOnResultImage ? (
            <Image
              source={{
                uri: tryOnResultImage,
              }}
              style={styles.stageImage}
              resizeMode="cover"
            />
          ) : savedOutfitPreview ? (
            <Image
              source={savedOutfitPreview}
              style={styles.stageImage}
              resizeMode="cover"
            />
          ) : pickedImage ? (
            <Image
              source={{
                uri: pickedImage,
              }}
              style={styles.stageImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={
                styles.avatarPlaceholder
              }
            >
              <Ionicons
                name="person-outline"
                size={78}
                color="#D1D5DB"
              />

              <Text
                style={
                  styles.placeholderText
                }
              >
                Avatar / Try-On Preview
              </Text>
            </View>
          )}

          <View
            style={styles.sourcePill}
          >
            <TouchableOpacity
              style={[
                styles.sourceIcon,
                savedOutfitLocked &&
                styles.sourceIconDisabled,
              ]}
              onPress={handleUploadPress}
              disabled={
                isBusy ||
                savedOutfitLocked
              }
            >
              <Ionicons
                name="camera-outline"
                size={21}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sourceIcon,
                activeSource ===
                "saved" &&
                styles.sourceIconActive,
              ]}
              onPress={() =>
                toggleSource("saved")
              }
            >
              <Ionicons
                name="bookmark"
                size={21}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sourceIcon,
                activeSource ===
                "wishlist" &&
                styles.sourceIconActive,
                savedOutfitLocked &&
                styles.sourceIconDisabled,
              ]}
              onPress={() =>
                toggleSource("wishlist")
              }
              disabled={savedOutfitLocked}
            >
              <Ionicons
                name="heart"
                size={21}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sourceIcon,
                activeSource ===
                "wardrobe" &&
                styles.sourceIconActive,
                savedOutfitLocked &&
                styles.sourceIconDisabled,
              ]}
              onPress={() =>
                toggleSource("wardrobe")
              }
              disabled={savedOutfitLocked}
            >
              <Ionicons
                name="layers-outline"
                size={21}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* SELECTED OUTFIT */}

        {selectedItems.length > 0 && (
          <View
            style={
              styles.selectedSection
            }
          >
            <Text
              style={
                styles.selectedTitle
              }
            >
              Selected Outfit
            </Text>

            <View
              style={
                styles.selectedSummary
              }
            >
              {selectedItems.map(
                (item) => (
                  <TouchableOpacity
                    key={
                      item.tryon_selected_item_id
                    }
                    style={
                      styles.selectedChip
                    }
                    onPress={() =>
                      removeSelectedCategory(
                        item.category
                      )
                    }
                    disabled={isBusy}
                  >
                    <Text
                      style={
                        styles.selectedChipText
                      }
                    >
                      {item.category}
                    </Text>

                    <Ionicons
                      name="close"
                      size={13}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )}

        {/* TRY ON */}

        {selectedItems.length >
          0 &&
          !tryOnResultImage && (
            <TouchableOpacity
              style={[
                styles.tryOnButton,
                isBusy &&
                styles.tryOnButtonDisabled,
              ]}
              onPress={
                handleCheckResult
              }
              disabled={isBusy}
            >
              <Ionicons
                name="sparkles-outline"
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.tryOnButtonText
                }
              >
                {checkingResult
                  ? "Processing..."
                  : "Try On"}
              </Text>
            </TouchableOpacity>
          )}

        {/* RESULT ACTIONS */}

        {tryOnResultImage && (
          <View
            style={
              styles.resultActions
            }
          >
            <TouchableOpacity
              style={
                styles.secondaryButton
              }
              onPress={
                handleCheckResult
              }
              disabled={isBusy}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color="#111827"
              />

              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                Try Again
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveResultButton,
                currentIsSaved &&
                styles.savedButton,
              ]}
              onPress={
                handleSaveTryOn
              }
              disabled={
                currentIsSaved ||
                isBusy
              }
            >
              <Ionicons
                name={
                  currentIsSaved
                    ? "bookmark"
                    : "bookmark-outline"
                }
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.saveResultButtonText
                }
              >
                {currentIsSaved
                  ? "Saved"
                  : savingOutfit
                    ? "Saving..."
                    : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* WARDROBE */}

        {activeSource ===
          "wardrobe" && (
            <View
              style={styles.section}
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Wardrobe
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterRow
                }
              >
                {CATEGORIES.map(
                  (category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterChip,
                        wardrobeFilter ===
                        category &&
                        styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setWardrobeFilter(
                          category
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterText,
                          wardrobeFilter ===
                          category &&
                          styles.filterTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>

              {wardrobeLoading ? (
                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Loading wardrobe...
                </Text>
              ) : filteredWardrobeItems.length ===
                0 ? (
                <Text
                  style={
                    styles.emptyText
                  }
                >
                  No wardrobe items in
                  this category.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                >
                  {filteredWardrobeItems.map(
                    (item) => {
                      const category =
                        getWardrobeCategory(
                          item
                        );

                      const selected =
                        isWardrobeItemSelected(
                          item
                        );

                      const disabled =
                        savedOutfitLocked ||
                        isCategoryUnavailable(
                          category,
                          selected
                        );

                      return (
                        <TouchableOpacity
                          key={
                            item.item_id
                          }
                          style={[
                            styles.itemCard,
                            selected &&
                            styles.itemCardSelected,
                            disabled &&
                            styles.itemCardDisabled,
                          ]}
                          disabled={disabled}
                          onPress={() =>
                            handleWardrobeItemPress(
                              item
                            )
                          }
                        >
                          <View
                            style={
                              styles.itemImageWrapper
                            }
                          >
                            {isRemoteImage(
                              item.image_url
                            ) ? (
                              <Image
                                source={{
                                  uri:
                                    item.image_url!,
                                }}
                                style={
                                  styles.itemImage
                                }
                              />
                            ) : (
                              <View
                                style={[
                                  styles.itemImage,
                                  styles.imagePlaceholder,
                                ]}
                              >
                                <Ionicons
                                  name="shirt-outline"
                                  size={30}
                                  color="#9CA3AF"
                                />
                              </View>
                            )}

                            {selected && (
                              <View
                                style={
                                  styles.selectedBadge
                                }
                              >
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color="#FFFFFF"
                                />
                              </View>
                            )}
                          </View>

                          <Text
                            style={
                              styles.itemName
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {
                              item.item_name
                            }
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </ScrollView>
              )}
            </View>
          )}

        {/* WISHLIST */}

        {activeSource ===
          "wishlist" && (
            <View
              style={styles.section}
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Wishlist
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterRow
                }
              >
                {CATEGORIES.map(
                  (category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterChip,
                        wishlistFilter ===
                        category &&
                        styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setWishlistFilter(
                          category
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterText,
                          wishlistFilter ===
                          category &&
                          styles.filterTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>

              {wishlistLoading ? (
                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Loading wishlist...
                </Text>
              ) : filteredWishlistItems.length ===
                0 ? (
                <Text
                  style={
                    styles.emptyText
                  }
                >
                  No wishlist items in
                  this category yet.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                >
                  {filteredWishlistItems.map(
                    (item) => {
                      const category =
                        getWishlistCategory(
                          item
                        );

                      const selected =
                        isWishlistItemSelected(
                          item
                        );

                      const disabled =
                        savedOutfitLocked ||
                        isCategoryUnavailable(
                          category,
                          selected
                        );

                      return (
                        <TouchableOpacity
                          key={
                            item.wishlist_id
                          }
                          style={[
                            styles.itemCard,
                            selected &&
                            styles.itemCardSelected,
                            disabled &&
                            styles.itemCardDisabled,
                          ]}
                          disabled={disabled}
                          onPress={() =>
                            handleWishlistItemPress(
                              item
                            )
                          }
                        >
                          <View
                            style={
                              styles.itemImageWrapper
                            }
                          >
                            {isRemoteImage(
                              item.image_url
                            ) ? (
                              <Image
                                source={{
                                  uri:
                                    item.image_url!,
                                }}
                                style={
                                  styles.itemImage
                                }
                              />
                            ) : (
                              <View
                                style={[
                                  styles.itemImage,
                                  styles.imagePlaceholder,
                                ]}
                              >
                                <Ionicons
                                  name="heart-outline"
                                  size={30}
                                  color="#9CA3AF"
                                />
                              </View>
                            )}

                            {selected && (
                              <View
                                style={
                                  styles.selectedBadge
                                }
                              >
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color="#FFFFFF"
                                />
                              </View>
                            )}

                            {!category && (
                              <View
                                style={
                                  styles.aiBadge
                                }
                              >
                                <Text
                                  style={
                                    styles.aiBadgeText
                                  }
                                >
                                  AI
                                </Text>
                              </View>
                            )}
                          </View>

                          <Text
                            style={
                              styles.itemName
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {
                              item.item_name
                            }
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </ScrollView>
              )}
            </View>
          )}

        {/* SAVED OUTFITS FROM HOME */}

        {activeSource ===
          "saved" && (
            <View
              style={styles.section}
            >
              <Text
                style={styles.sectionTitle}
              >
                Saved Outfits
              </Text>

              {savedLoading ? (
                <Text
                  style={styles.emptyText}
                >
                  Loading saved outfits...
                </Text>
              ) : savedOutfits.length === 0 ? (
                <Text
                  style={styles.emptyText}
                >
                  No saved outfits yet.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {savedOutfits.map((item) => {
                    const image = getSavedOutfitImage(item);

                    const selected =
                      selectedSavedOutfitId ===
                      item.saved_outfit_id;

                    const disabled =
                      savedOutfitLocked &&
                      !selected;

                    return (
                      <TouchableOpacity
                        key={item.saved_outfit_id}
                        style={[
                          styles.itemCard,
                          selected &&
                          styles.itemCardSelected,
                          disabled &&
                          styles.itemCardDisabled,
                        ]}
                        disabled={disabled}
                        onPress={() =>
                          handleSavedOutfitPress(item)
                        }
                      >
                        <View
                          style={styles.itemImageWrapper}
                        >
                          {image ? (
                            <Image
                              source={image}
                              style={styles.itemImage}
                            />
                          ) : (
                            <View
                              style={[
                                styles.itemImage,
                                styles.imagePlaceholder,
                              ]}
                            >
                              <Ionicons
                                name="shirt-outline"
                                size={30}
                                color="#9CA3AF"
                              />
                            </View>
                          )}

                          {selected && (
                            <View
                              style={styles.selectedBadge}
                            >
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="#FFFFFF"
                              />
                            </View>
                          )}
                        </View>
                        <Text
                          style={styles.itemName}
                          numberOfLines={1}
                        >
                          {item.outfit_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ===========================================================
// STYLES
// ===========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },

  scrollContent: {
    paddingBottom: 36,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 6,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  stage: {
    height: 400,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
    position: "relative",
  },

  stageImage: {
    width: "100%",
    height: "100%",
  },

  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderText: {
    marginTop: 10,
    color: "#9CA3AF",
    fontSize: 13,
  },

  sourcePill: {
    position: "absolute",
    right: 14,
    top: 55,
    width: 58,
    paddingVertical: 12,
    backgroundColor: "#374151",
    borderRadius: 30,
    alignItems: "center",
    gap: 14,
  },

  sourceIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  sourceIconActive: {
    backgroundColor: "rgba(255,255,255,0.20)",
  },

  sourceIconDisabled: {
    opacity: 0.35,
  },

  selectedSection: {
    marginTop: 14,
  },

  selectedTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  selectedSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#111827",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },

  selectedChipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },

  tryOnButton: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#111827",
  },

  tryOnButtonDisabled: {
    opacity: 0.5,
  },

  tryOnButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  resultActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },

  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },

  secondaryButtonText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },

  saveResultButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: "#111827",
  },

  saveResultButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  savedButton: {
    backgroundColor: "#16A34A",
  },

  section: {
    marginTop: 18,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  filterRow: {
    gap: 8,
    paddingBottom: 12,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
  },

  filterChipActive: {
    backgroundColor: "#111827",
  },

  filterText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  itemCard: {
    width: 105,
    marginRight: 12,
    borderRadius: 14,
  },

  itemCardSelected: {
    borderWidth: 2,
    borderColor: "#111827",
    padding: 2,
  },

  itemCardDisabled: {
    opacity: 0.55,
  },

  itemImageWrapper: {
    position: "relative",
  },

  itemImage: {
    width: 101,
    height: 130,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },

  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  selectedBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  aiBadge: {
    position: "absolute",
    top: 7,
    left: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor:
      "rgba(17,24,39,0.85)",
    borderRadius: 999,
  },

  aiBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },

  itemName: {
    marginTop: 6,
    color: "#111827",
    fontSize: 11,
    fontWeight: "600",
  },

  emptyText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});