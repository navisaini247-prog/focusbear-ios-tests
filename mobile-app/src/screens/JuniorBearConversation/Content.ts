import { ImageSourcePropType } from "react-native";
import WelcomeBear1 from "@/assets/bears/welcome-bear-1.png";
import WelcomeBear2 from "@/assets/bears/welcome-bear-2.png";
import WelcomeBear2_5 from "@/assets/bears/welcome-bear-2.5.png";
import WelcomeBear3 from "@/assets/bears/welcome-bear-3.png";
import WelcomeBear4 from "@/assets/bears/welcome-bear-4.png";
import PirateBear1 from "@/assets/bears/pirate-bear-1.png";
import PirateBear1_5 from "@/assets/bears/pirate-bear-1.5.png";
import PirateBear2 from "@/assets/bears/pirate-bear-2.png";
import PirateBear3 from "@/assets/bears/pirate-bear-3.png";
import PirateBear4 from "@/assets/bears/pirate-bear-4.png";
import PirateBear5 from "@/assets/bears/pirate-bear-5.png";

const WelcomeBear5Lottie = require("@/assets/bears/welcome-bear-5.json");

export enum JuniorBearStepId {
  GreetingIntro = "greeting_intro",
  PirateModeIntro = "pirate_mode_intro",
  AdhdStory = "adhd_story",
  WhatHelpQuestion = "what_help_question",
  TeamUpInvite = "team_up_invite",
  FocusAreaSelection = "focus_area_selection",
  SignupDecision = "signup_decision",
}

export interface StepOption {
  key: string;
  labelKey: string;
  nextStep: JuniorBearStepId;
  switchToPirate?: boolean;
  onPress?: () => void;
}

export interface StepContent {
  messageKey: string;
  primaryButtonKey?: string;
  secondaryButtonKey?: string;
  image?: ImageSourcePropType;
  lottieSource?: any;
  options?: StepOption[];
}

export const MODE = {
  NORMAL: "normal",
  PIRATE: "pirate",
} as const;

export type ModeType = typeof MODE.NORMAL | typeof MODE.PIRATE;

export const STEP_CONTENT: Record<ModeType, Partial<Record<JuniorBearStepId, StepContent>>> = {
  normal: {
    [JuniorBearStepId.GreetingIntro]: {
      messageKey: "juniorBearConversation.messageNormalStep1",
      primaryButtonKey: "juniorBearConversation.buttonNormalStep1Primary",
      secondaryButtonKey: "juniorBearConversation.buttonNormalStep1Secondary",
      image: WelcomeBear1,
    },
    [JuniorBearStepId.AdhdStory]: {
      messageKey: "juniorBearConversation.messageNormalStep2",
      primaryButtonKey: "juniorBearConversation.buttonNormalStep2Primary",
      secondaryButtonKey: "juniorBearConversation.buttonNormalStep2Secondary",
      image: WelcomeBear2,
    },
    [JuniorBearStepId.WhatHelpQuestion]: {
      messageKey: "juniorBearConversation.messageNormalStep2_5",
      image: WelcomeBear2_5,
      options: [
        {
          key: "healthy_habits",
          labelKey: "juniorBearConversation.buttonNormalStep2_5Option1",
          nextStep: JuniorBearStepId.SignupDecision,
        },
        {
          key: "organise_tasks",
          labelKey: "juniorBearConversation.buttonNormalStep2_5Option2",
          nextStep: JuniorBearStepId.SignupDecision,
        },
      ],
    },
    [JuniorBearStepId.TeamUpInvite]: {
      messageKey: "juniorBearConversation.messageNormalStep3",
      primaryButtonKey: "juniorBearConversation.buttonNormalStep3Primary",
      secondaryButtonKey: "juniorBearConversation.buttonNormalStep3Secondary",
      image: WelcomeBear3,
    },
    [JuniorBearStepId.FocusAreaSelection]: {
      messageKey: "juniorBearConversation.messageNormalStep4",
      primaryButtonKey: "juniorBearConversation.buttonNormalStep4Primary",
      image: WelcomeBear4,
    },
    [JuniorBearStepId.SignupDecision]: {
      messageKey: "juniorBearConversation.messageNormalStep5",
      primaryButtonKey: "juniorBearConversation.buttonNormalStep5Primary",
      secondaryButtonKey: "juniorBearConversation.buttonNormalStep5Secondary",
      lottieSource: WelcomeBear5Lottie,
    },
  },
  pirate: {
    [JuniorBearStepId.GreetingIntro]: {
      messageKey: "juniorBearConversation.messagePirateStep1",
      primaryButtonKey: "juniorBearConversation.buttonPirateStep1Primary",
      image: PirateBear1,
    },
    [JuniorBearStepId.PirateModeIntro]: {
      messageKey: "juniorBearConversation.messagePirateStep1_5",
      primaryButtonKey: "juniorBearConversation.buttonPirateStep1_5Primary",
      image: PirateBear1_5,
    },
    [JuniorBearStepId.AdhdStory]: {
      messageKey: "juniorBearConversation.messagePirateStep2",
      primaryButtonKey: "juniorBearConversation.buttonPirateStep2Primary",
      secondaryButtonKey: "juniorBearConversation.buttonPirateStep2Secondary",
      image: PirateBear2,
    },
    [JuniorBearStepId.WhatHelpQuestion]: {
      messageKey: "juniorBearConversation.messagePirateStep2_5",
      image: PirateBear2,
      options: [
        {
          key: "healthy_habits",
          labelKey: "juniorBearConversation.buttonPirateStep2_5Option1",
          nextStep: JuniorBearStepId.SignupDecision,
        },
        {
          key: "organise_tasks",
          labelKey: "juniorBearConversation.buttonPirateStep2_5Option2",
          nextStep: JuniorBearStepId.SignupDecision,
        },
      ],
    },
    [JuniorBearStepId.TeamUpInvite]: {
      messageKey: "juniorBearConversation.messagePirateStep3",
      primaryButtonKey: "juniorBearConversation.buttonPirateStep3Primary",
      secondaryButtonKey: "juniorBearConversation.buttonPirateStep3Secondary",
      image: PirateBear3,
    },
    [JuniorBearStepId.FocusAreaSelection]: {
      messageKey: "juniorBearConversation.messagePirateStep4",
      primaryButtonKey: "juniorBearConversation.buttonPirateStep4Primary",
      image: PirateBear4,
    },
    [JuniorBearStepId.SignupDecision]: {
      messageKey: "juniorBearConversation.messagePirateStep5",
      primaryButtonKey: "juniorBearConversation.buttonPirateStep5Primary",
      secondaryButtonKey: "juniorBearConversation.buttonPirateStep5Secondary",
      image: PirateBear5,
    },
  },
};
