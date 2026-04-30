import React from "react";
import { BodySmallText } from "@/components/Text";
import { AppQuality } from "@/types/AppUsage.types";
import { useTheme } from "@react-navigation/native";
import { useAppUsage } from "../Screentime/context/AppUsageContext";

interface QualityDescriptionProps {
  quality: AppQuality;
  description: string;
}

export const QualityDescription: React.FC<QualityDescriptionProps> = ({ quality, description }) => {
  const { colors } = useTheme();
  const { getQualityLabel, getQualityColor } = useAppUsage();
  const highlightText = getQualityLabel(quality);
  const parts = description.split(highlightText);

  if (parts.length === 2) {
    return (
      <>
        {parts[0]}
        <BodySmallText weight="700" color={getQualityColor(quality, colors)}>
          {highlightText}
        </BodySmallText>
        {parts[1]}
      </>
    );
  }

  return <>{description}</>;
};
