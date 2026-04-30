import React, { useState, useRef } from "react";
import { StyleSheet, ScrollView } from "react-native";
import PropTypes from "prop-types";
import { BodySmallText, SmallButton, Group, Card } from "@/components";
import { useSelector } from "react-redux";
import Clipboard from "@react-native-clipboard/clipboard";
import { userIdSelector } from "@/selectors/UserSelectors";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";

const UserIdCopy = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);
  const userId = useSelector(userIdSelector);
  const isCopiedTimeout = useRef(null);

  const handleCopy = () => {
    Clipboard.setString(userId);
    setIsCopied(true);
    isCopiedTimeout.current = setTimeout(() => setIsCopied(false), 2000);
    return () => clearTimeout(isCopiedTimeout.current);
  };

  return (
    userId && (
      <Group horizontal style={styles.container}>
        <Card style={styles.textContainer}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.scrollViewContentContainer}
            showsHorizontalScrollIndicator={false}
            fadingEdgeLength={32}
          >
            <BodySmallText numberOfLines={1}>
              <BodySmallText color={colors.subText}>{t("settings.userid")} </BodySmallText>
              {userId}
            </BodySmallText>
          </ScrollView>
        </Card>
        <SmallButton onPress={handleCopy} title={isCopied ? t("settings.copied") : t("settings.copy")} />
      </Group>
    )
  );
};

UserIdCopy.propTypes = {
  textColor: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scrollViewContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default UserIdCopy;
