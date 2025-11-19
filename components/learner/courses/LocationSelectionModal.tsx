import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import { memo } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import styles from "./styles";
import type { District, Province } from "./types";

type BaseItem = Province | District;

type LocationSelectionModalProps = {
  title: string;
  items: BaseItem[];
  visible: boolean;
  loading: boolean;
  selectedItem: BaseItem | null;
  onSelect: (item: BaseItem | null) => void;
  onClose: () => void;
  bottomInset: number;
};

const LocationSelectionModalComponent: FC<LocationSelectionModalProps> = ({
  title,
  items,
  visible,
  loading,
  selectedItem,
  onSelect,
  onClose,
  bottomInset,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { paddingBottom: bottomInset + 20 }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.modalLoading}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : (
          <ScrollView>
            <TouchableOpacity
              style={[
                styles.modalItem,
                !selectedItem && styles.modalItemActive,
              ]}
              onPress={() => onSelect(null)}
            >
              <Text
                style={[
                  styles.modalItemText,
                  !selectedItem && styles.modalItemTextActive,
                ]}
              >
                Tất cả
              </Text>
              {!selectedItem && (
                <Ionicons name="checkmark" size={20} color="#10B981" />
              )}
            </TouchableOpacity>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.modalItem,
                  selectedItem?.id === item.id && styles.modalItemActive,
                ]}
                onPress={() => onSelect(item)}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    selectedItem?.id === item.id &&
                      styles.modalItemTextActive,
                  ]}
                >
                  {item.name}
                </Text>
                {selectedItem?.id === item.id && (
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  </Modal>
);

const LocationSelectionModal = memo(LocationSelectionModalComponent);
LocationSelectionModal.displayName = "LocationSelectionModal";

export default LocationSelectionModal;

