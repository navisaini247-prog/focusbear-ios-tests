import React, { Fragment, memo } from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { BodySmallText, SmallButton, Separator, ButtonProps } from "@/components";
import COLOR from "@/constants/color";
import { useTheme } from "@react-navigation/native";

interface HorizontalSelectorProps extends ViewProps {
  items: { key: string; text: string }[];
  selectedItem: string;
  setSelectedItem: (key: string) => void;
}

export const HorizontalSelector = ({
  items,
  selectedItem,
  setSelectedItem,
  style,
  ...props
}: HorizontalSelectorProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, styles.container, { backgroundColor: colors.secondary }, style]} {...props}>
      {items.map(({ key, ...item }, index) => (
        <Fragment key={key}>
          {index !== 0 && <Separator vertical style={{ backgroundColor: colors.secondaryBorder }} />}
          <HorizontalSelectorItem
            itemKey={key}
            isSelected={selectedItem === key}
            setSelectedItem={setSelectedItem}
            {...item}
          />
        </Fragment>
      ))}
    </View>
  );
};

interface HorizontalSelectorItemProps extends ButtonProps {
  itemKey: string;
  isSelected: boolean;
  setSelectedItem: (key: string) => void;
}

const HorizontalSelectorItem = memo(function HorizontalSelectorItem({
  itemKey,
  isSelected,
  setSelectedItem,
  title,
  ...props
}: HorizontalSelectorItemProps) {
  const { colors } = useTheme();

  return (
    <SmallButton
      subtle
      style={[styles.button, !isSelected && styles.notSelectedButton]}
      onPress={() => setSelectedItem(itemKey)}
      hitSlop={{ top: 12, bottom: 12 }}
      {...props}
    >
      <BodySmallText color={isSelected ? colors.text : colors.subText}>{title}</BodySmallText>
    </SmallButton>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  container: {
    padding: 4,
    paddingHorizontal: 6,
    borderRadius: 13,
    marginHorizontal: -4,
  },
  button: {
    zIndex: 10,
    marginHorizontal: -2,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  notSelectedButton: {
    borderColor: COLOR.TRANSPARENT,
    backgroundColor: COLOR.TRANSPARENT,
  },
});
