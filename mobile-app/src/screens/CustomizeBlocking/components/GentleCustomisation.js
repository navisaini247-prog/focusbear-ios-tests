import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";

import { HeadingSmallText, BodySmallText, Card, Separator, AnimatedHeightView, ScalableIcon } from "@/components";

import { CustomSoftBlocking } from "./CustomSoftBlocking";
import { CustomPauseDelay } from "./CustomPauseDelay";

function AccordionItem({ title, description, children, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useTheme();

  return (
    <View>
      <TouchableOpacity
        style={styles.itemHeader}
        onPress={() => setExpanded((expanded) => !expanded)}
        activeOpacity={0.7}
        testID="test:id/gentle-customisation-item"
      >
        <View style={styles.itemTitleRow}>
          <HeadingSmallText style={styles.itemTitle}>{title}</HeadingSmallText>
          {expanded && description ? (
            <BodySmallText style={[styles.itemDescription, { color: colors.subText }]}>{description}</BodySmallText>
          ) : null}
        </View>
        <ScalableIcon
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.subText}
          iconType="Ionicons"
        />
      </TouchableOpacity>

      <AnimatedHeightView>{expanded && <View style={styles.itemContent}>{children}</View>}</AnimatedHeightView>

      {!isLast && <Separator />}
    </View>
  );
}

export function GentleCustomisation({
  unlockMinutes,
  setUnlockMinutes,
  unlockSeconds,
  setUnlockSeconds,
  pauseBaseDelay,
  setPauseBaseDelay,
}) {
  const { t } = useTranslation();

  const items = [
    {
      key: "softBlocking",
      title: t("customizeBlocking.customSoftBlocking.title"),
      description: t("customizeBlocking.customSoftBlocking.description"),
      content: (
        <CustomSoftBlocking
          minutes={unlockMinutes}
          setMinutes={setUnlockMinutes}
          seconds={unlockSeconds}
          setSeconds={setUnlockSeconds}
        />
      ),
    },
    {
      key: "pauseDelay",
      title: t("customizeBlocking.customPauseDelay.title"),
      description: t("customizeBlocking.customPauseDelay.description"),
      content: <CustomPauseDelay baseDelay={pauseBaseDelay} setBaseDelay={setPauseBaseDelay} />,
    },
  ];

  return (
    <Card noPadding>
      {items.map((item, index) => (
        <AccordionItem
          key={item.key}
          title={item.title}
          description={item.description}
          isLast={index === items.length - 1}
        >
          {item.content}
        </AccordionItem>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  itemTitleRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    flexShrink: 1,
  },
  itemDescription: {
    flexShrink: 1,
  },
  itemContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
    gap: 16,
  },
});
