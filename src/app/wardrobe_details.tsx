import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://127.0.0.1:3000";

type WardrobeItem = {
    item_id: number;
    user_id: number;
    item_name: string;
    category: string | null;
    sub_category: string | null;
    brand: string | null;
    color: string | null;
    pattern: string | null;
    material: string | null;
    season: string | null;
    image_url: string | null;
    source_type: string | null;
    shopping_url: string | null;
    price: number | null;
    favorite: boolean | null;
};

export default function WardrobeDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const itemId = Number(params.id);

    const [item, setItem] = useState<WardrobeItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const loadItem = useCallback(async () => {
        try {
            setLoading(true);

            const token = await SecureStore.getItemAsync("authToken");

            if (!token) {
                Alert.alert("Login required", "Please log in again.");
                router.replace("/login");
                return;
            }

            const response = await fetch(`${API_URL}/api/wardrobe`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || data.message || "Failed to load wardrobe item"
                );
            }

            const items: WardrobeItem[] = Array.isArray(data) ? data : [];

            const foundItem = items.find(
                (wardrobeItem) => wardrobeItem.item_id === itemId
            );

            if (!foundItem) {
                Alert.alert("Item not found", "This wardrobe item no longer exists.");
                router.back();
                return;
            }

            setItem(foundItem);
        } catch (error) {
            console.error("Wardrobe details error:", error);

            Alert.alert(
                "Error",
                error instanceof Error
                    ? error.message
                    : "Failed to load wardrobe item."
            );
        } finally {
            setLoading(false);
        }
    }, [itemId, router]);

    useEffect(() => {
        if (!Number.isNaN(itemId)) {
            loadItem();
        } else {
            setLoading(false);
        }
    }, [itemId, loadItem]);

    const handleDelete = () => {
        if (!item) return;

        Alert.alert(
            "Delete Item",
            `Are you sure you want to delete "${item.item_name}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: deleteItem,
                },
            ]
        );
    };

    const deleteItem = async () => {
        if (!item || deleting) return;

        try {
            setDeleting(true);

            const token = await SecureStore.getItemAsync("authToken");

            if (!token) {
                Alert.alert("Login required", "Please log in again.");
                return;
            }

            const response = await fetch(
                `${API_URL}/api/wardrobe/${item.item_id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || data.message || "Failed to delete item"
                );
            }

            Alert.alert("Deleted", "Wardrobe item deleted successfully.", [
                {
                    text: "OK",
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            console.error("Delete wardrobe error:", error);

            Alert.alert(
                "Error",
                error instanceof Error
                    ? error.message
                    : "Failed to delete wardrobe item."
            );
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F48FB1" />
                    <Text style={styles.loadingText}>Loading item...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!item) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.emptyText}>Item not found.</Text>

                    <TouchableOpacity
                        style={styles.backButtonSimple}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonSimpleText}>Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={25} color="#111827" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Wardrobe Details</Text>

                <View style={styles.headerButtonPlaceholder} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {item.image_url ? (
                    <Image
                        source={{ uri: item.image_url }}
                        style={styles.image}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons
                            name="shirt-outline"
                            size={80}
                            color="#D1D5DB"
                        />
                    </View>
                )}

                <View style={styles.content}>
                    <Text style={styles.itemName}>{item.item_name}</Text>

                    {item.category && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>
                                {item.category}
                            </Text>
                        </View>
                    )}

                    <View style={styles.detailsCard}>
                        <DetailRow label="Brand" value={item.brand} />
                        <DetailRow label="Color" value={item.color} />
                        <DetailRow label="Pattern" value={item.pattern} />
                        <DetailRow label="Material" value={item.material} />
                        <DetailRow label="Season" value={item.season} />
                        <DetailRow
                            label="Favorite"
                            value={item.favorite ? "Yes" : "No"}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.deleteButton,
                            deleting && styles.disabledButton,
                        ]}
                        onPress={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons
                                    name="trash-outline"
                                    size={20}
                                    color="#FFFFFF"
                                />
                                <Text style={styles.deleteButtonText}>
                                    Delete Item
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    if (!value) return null;

    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF8FA",
    },

    header: {
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        backgroundColor: "#FFF8FA",
    },

    headerButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },

    headerButtonPlaceholder: {
        width: 42,
    },

    headerTitle: {
        fontSize: 19,
        fontWeight: "700",
        color: "#111827",
    },

    scrollContent: {
        paddingBottom: 50,
    },

    image: {
        width: "100%",
        height: 390,
        resizeMode: "cover",
        backgroundColor: "#F3F4F6",
    },

    imagePlaceholder: {
        width: "100%",
        height: 390,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
    },

    content: {
        padding: 20,
    },

    itemName: {
        fontSize: 28,
        fontWeight: "800",
        color: "#111827",
    },

    categoryBadge: {
        alignSelf: "flex-start",
        marginTop: 10,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: "#FCE7F3",
    },

    categoryText: {
        color: "#BE185D",
        fontSize: 14,
        fontWeight: "600",
    },

    detailsCard: {
        marginTop: 24,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 6,
    },

    detailRow: {
        minHeight: 54,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },

    detailLabel: {
        fontSize: 15,
        color: "#6B7280",
    },

    detailValue: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
        maxWidth: "60%",
        textAlign: "right",
    },

    deleteButton: {
        height: 54,
        marginTop: 30,
        borderRadius: 16,
        backgroundColor: "#E11D48",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },

    deleteButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },

    disabledButton: {
        opacity: 0.6,
    },

    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
    },

    loadingText: {
        marginTop: 14,
        color: "#6B7280",
        fontSize: 14,
    },

    emptyText: {
        fontSize: 17,
        color: "#6B7280",
    },

    backButtonSimple: {
        marginTop: 20,
        backgroundColor: "#F48FB1",
        paddingHorizontal: 26,
        paddingVertical: 12,
        borderRadius: 14,
    },

    backButtonSimpleText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
});