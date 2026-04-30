/* eslint-disable no-useless-escape */
import { Alert } from "react-native";
import OverlayPermissionModule from "rn-android-overlay-permission";
import { PLATFORM_SPECIFIC } from "./Enums";
import DeviceInfo, { getBundleId } from "react-native-device-info";
import { zip } from "react-native-zip-archive";
import { i18n } from "@/localization";
import { checkIsAndroid } from "./PlatformMethods";
import { exists, readdir, stat, unlink, mkdir } from "react-native-fs";
import { addErrorLog, addInfoLog } from "./FileLogger";
import { isEqual } from "lodash";
import { UsagePermissionModule } from "@/nativeModule";
import { VIDEO_TYPES } from "@/constants/videos";

/**
 * This regex is to check youtube link is valid & to get the video Id to play.
 */
const YOUTUBE_REGEX =
  /^https?\:\/\/(?:www\.youtube(?:\-nocookie)?\.com\/|m\.youtube\.com\/|youtube\.com\/)?(?:ytscreeningroom\?vi?=|youtu\.be\/|vi?\/|user\/.+\/u\/\w{1,2}\/|embed\/|watch\?(?:.*\&)?vi?=|\&vi?=|\?(?:.*\&)?vi?=)([^#\&\?\n\/<>"']*)/i;

/**
 * This regex is to check vimeo link is valid & to get the video Id to play.
 */
const VIMEO_REGEX =
  /^https?:\/\/(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/i;

/**
 *
 * Method to get draw over other apps permission from android.
 * @param {boolean} startService send TRUE when we want to start overlay functionality.
 */
const overlayPermission = (startService = false) => {
  return new Promise((resolve, reject) => {
    if (checkIsAndroid()) {
      OverlayPermissionModule.isRequestOverlayPermissionGranted((status) => {
        if (status) {
          reject("OVERLAY_PERMISSION_NOT_PROVIDED");
        } else {
          resolve("OVERLAY_PERMISSION_PROVIDED");
        }
      });
    } else {
      reject("NOT_ANDROID");
    }
  });
};

/**
 * Method to check USAGE STAT permission from android to check the foreground apps.
 * @param {boolean} startService send TRUE when we want to start overlay functionality.
 */
const checkUsageStatPermission = (startService = false) => {
  return new Promise((resolve, reject) => {
    if (checkIsAndroid()) {
      UsagePermissionModule.isUsageAccessEnabled()
        .then((resp) => {
          if (!resp) {
            reject("USAGE_STAT_PERMISSION_NOT_PROVIDED");
          } else {
            resolve("USAGE_STAT_PERMISSION_PROVIDED");
          }
        })
        .catch((error) => {
          reject("UNEXPECTED_ERROR");
        });
    } else {
      reject("NOT_ANDROID");
    }
  });
};

/**
 * Method to get USAGE STAT permission from android to check the foreground apps.
 * @param {boolean} startService send TRUE when we want to start overlay functionality.
 */
const getUsageStatPermission = (startService = false) => {
  return new Promise((resolve, reject) => {
    if (checkIsAndroid()) {
      UsagePermissionModule.requestUsageAccess();
      resolve("IS_ANDROID");
    } else {
      reject("NOT_ANDROID");
    }
  });
};

const NormalAlert = ({
  title = "",
  message = "",
  yesText = "",
  cancelText = "",
  singleButton = true,
  onPressYesButton = null,
}) => {
  return new Promise((resolve, reject) => {
    singleButton
      ? Alert.alert(title, message, [{ text: yesText, onPress: () => resolve(true), style: "default" }], {
          cancelable: false,
        })
      : Alert.alert(
          title,
          message,
          [
            {
              text: cancelText || i18n.t("common.cancel"),
              onPress: () => resolve(false),
              style: "default",
            },
            {
              text: yesText || i18n.t("common.ok"),
              onPress: () => (onPressYesButton ? onPressYesButton() : resolve(true)),
              style: "default",
            },
          ],
          { cancelable: false },
        );
  });
};

const generateRandomInteger = (min, max) => {
  return Math.floor(min + Math.random() * (max - min + 1));
};

const checkIsDev = () => {
  let bundleId = getBundleId();
  bundleId = bundleId?.split(".").pop();

  return bundleId && bundleId === "development";
};

export const checkIsDebug = () => {
  return __DEV__;
};

function zipLogFilesAndReturnPath() {
  return new Promise((resolve, reject) => {
    const logsDirectory = PLATFORM_SPECIFIC.LOG_PATH;
    const zipFilePath = PLATFORM_SPECIFIC.ZIP_PATH;
    const isAndroid = checkIsAndroid();

    // First, check if logs directory exists and create it if it doesn't
    exists(logsDirectory)
      .then((logsDirExists) => {
        if (!logsDirExists) {
          addInfoLog(`Creating logs directory at ${logsDirectory}`);
          return mkdir(logsDirectory);
        }
        return Promise.resolve();
      })
      .then(() => {
        // iOS automatically creates the new zip with updated changes.
        // Android needs to delete the old zip every time when there is any change.
        if (isAndroid) {
          return exists(zipFilePath).then((isExist) => {
            if (isExist) {
              return unlink(zipFilePath)
                .then(() => {
                  addInfoLog("Deleted old zip file");
                })
                .catch((err) => {
                  addErrorLog(`There was an error deleting old zip file ${err}`);
                });
            }
            return Promise.resolve();
          });
        }
        return Promise.resolve();
      })
      .then(() => {
        return zip(logsDirectory, zipFilePath);
      })
      .then((path) => {
        addInfoLog(`Zip generated at ${path}`);
        resolve(path);
      })
      .catch((error) => {
        addErrorLog("Error creating Zip", error);
        reject(error);
      });
  });
}

const getAppVersion = () => DeviceInfo.getVersion();

const deleteImagesInFolder = async (folderPath) => {
  try {
    // Get all items (files and directories) inside the folder
    const items = await readdir(folderPath);

    // Regular expression to match .jpg, .jpeg, or .png extensions
    const imageRegex = /\.(jpg|jpeg|png|webp)$/i;

    // Iterate over each item
    for (const item of items) {
      const itemPath = `${folderPath}/${item}`;
      const itemStat = await stat(itemPath);

      if (itemStat.isFile()) {
        // If it's a file, check if it's a .jpg , .jpeg or .png file
        if (imageRegex.test(item)) {
          // If it's a .jpg or .png file, delete it
          await unlink(itemPath);
        }
      }
    }
  } catch (error) {
    addErrorLog(`Error deleting images in folder ${error}`);
  }
};

const deepCompare = (left, right) => isEqual(left, right);

const isYoutubeUrl = (url) => YOUTUBE_REGEX.test(url);

const isVimeoUrl = (url) => VIMEO_REGEX.test(url);

const getVideoType = (url) => {
  if (!url) return VIDEO_TYPES.OTHER;
  if (isYoutubeUrl(url)) return VIDEO_TYPES.YOUTUBE;
  if (isVimeoUrl(url)) return VIDEO_TYPES.VIMEO;
  return VIDEO_TYPES.OTHER;
};

const isValidVideoUrl = (url) => {
  if (!url) return false;
  return isYoutubeUrl(url) || isVimeoUrl(url);
};

const extractVideoId = (url, type = null) => {
  if (!url) return "";

  const videoType = type || getVideoType(url);

  if (videoType === VIDEO_TYPES.YOUTUBE) {
    const match = url.match(YOUTUBE_REGEX);
    return match ? match[1] : "";
  } else if (videoType === VIDEO_TYPES.VIMEO) {
    const match = url.match(VIMEO_REGEX);
    return match ? match[1] : "";
  }

  return "";
};

/**
 * Returns a new array with the elements rotated to the left by n.
 */
const rotateLeft = (arr, n) => [...arr.slice(n), ...arr.slice(0, n)];

export {
  deepCompare,
  YOUTUBE_REGEX,
  VIMEO_REGEX,
  isVimeoUrl,
  isYoutubeUrl,
  getVideoType,
  isValidVideoUrl,
  extractVideoId,
  overlayPermission,
  checkUsageStatPermission,
  getUsageStatPermission,
  NormalAlert,
  generateRandomInteger,
  checkIsDev,
  zipLogFilesAndReturnPath,
  getAppVersion,
  deleteImagesInFolder,
  rotateLeft,
};
