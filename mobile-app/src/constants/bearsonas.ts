import React from "react";
import { SvgProps } from "react-native-svg";
import { LanguageKeys } from "@/localization/i18n";

import {
  BearsonaBowtieConcerned,
  BearsonaBowtieScream,
  BearsonaBowtieShocked,
  BearsonaBowtieOG,
  BearsonaJesterConcerned,
  BearsonaJesterOG,
  BearsonaJesterScream,
  BearsonaJesterShocked,
  BearsonaOGConcerned,
  BearsonaOGOG,
  BearsonaOGScream,
  BearsonaOGShocked,
  BearsonaPirateConcerned,
  BearsonaPirateOG,
  BearsonaPirateScream,
  BearsonaPirateShocked,
  BearsonaSassyConcerned,
  BearsonaSassyOG,
  BearsonaSassyScream,
  BearsonaSassyShocked,
  BearsonaCheerleaderConcerned,
  BearsonaCheerleaderOG,
  BearsonaCheerleaderScream,
  BearsonaCheerleaderShocked,
} from "@/assets";

interface IBearsona {
  name: string;
  customLanguage: LanguageKeys | null;
  profilePictures: {
    concerned: React.FC<SvgProps>;
    scream: React.FC<SvgProps>;
    shocked: React.FC<SvgProps>;
    og: React.FC<SvgProps>;
  };
}

export const BEARSONAS: IBearsona[] = [
  {
    name: "default",
    customLanguage: null,
    profilePictures: {
      concerned: BearsonaOGConcerned,
      scream: BearsonaOGScream,
      shocked: BearsonaOGShocked,
      og: BearsonaOGOG,
    },
  },
  {
    name: "focus",
    customLanguage: null,
    profilePictures: {
      concerned: BearsonaBowtieConcerned,
      scream: BearsonaBowtieScream,
      shocked: BearsonaBowtieShocked,
      og: BearsonaBowtieOG,
    },
  },
  {
    name: "pirate",
    customLanguage: "en_pirate",
    profilePictures: {
      concerned: BearsonaPirateConcerned,
      scream: BearsonaPirateScream,
      shocked: BearsonaPirateShocked,
      og: BearsonaPirateOG,
    },
  },
  {
    name: "jester",
    customLanguage: "en_jester",
    profilePictures: {
      concerned: BearsonaJesterConcerned,
      scream: BearsonaJesterScream,
      shocked: BearsonaJesterShocked,
      og: BearsonaJesterOG,
    },
  },
  {
    name: "sassy",
    customLanguage: "en_sassy",
    profilePictures: {
      concerned: BearsonaSassyConcerned,
      scream: BearsonaSassyScream,
      shocked: BearsonaSassyShocked,
      og: BearsonaSassyOG,
    },
  },
  {
    name: "cheerleader",
    customLanguage: "en_cheer",
    profilePictures: {
      concerned: BearsonaCheerleaderConcerned,
      scream: BearsonaCheerleaderScream,
      shocked: BearsonaCheerleaderShocked,
      og: BearsonaCheerleaderOG,
    },
  },
];
