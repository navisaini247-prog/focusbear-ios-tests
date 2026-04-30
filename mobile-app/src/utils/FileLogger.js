import { Alert } from "react-native";
import { FileLogger, LogLevel, logLevelNames } from "react-native-file-logger";
import { PLATFORM_SPECIFIC } from "./Enums";
import { checkIsDebug } from "./GlobalMethods";
import { store } from "@/store";
import { exists, mkdir } from "react-native-fs";

const configureFileLogger = () => {
  const logFormatter = (level, msg) => {
    const now = new Date();
    const levelName = logLevelNames[level];
    return `${now.toLocaleString()} [${levelName}] => ${msg}`;
  };

  // First, ensure the logs directory exists
  exists(PLATFORM_SPECIFIC.LOG_PATH)
    .then((logsDirExists) => {
      if (!logsDirExists) {
        console.log(`Creating logs directory at ${PLATFORM_SPECIFIC.LOG_PATH}`);
        return mkdir(PLATFORM_SPECIFIC.LOG_PATH);
      }
      return Promise.resolve();
    })
    .then(() => {
      // Configure the file logger after ensuring directory exists
      return FileLogger.configure({
        logLevel: LogLevel.Info,
        logsDirectory: PLATFORM_SPECIFIC.LOG_PATH,
        formatter: logFormatter,
        captureConsole: false,
        fileNamePattern: "focusbear-%d{yyyy-MM-dd}.log",
        maxFileSize: 1024 * 1024, // 1MB
        maxNumberOfFiles: 7, // Keep 7 days of logs
      });
    })
    .then(() => console.log("File-logger configured"))
    .catch((error) => console.log(`File logger configuration error: ${error}`));
};

const showLogFilePaths = async () => {
  Alert.alert("File paths", (await FileLogger.getLogFilePaths()).join("\n"));
};

const formatMessage = (...args) =>
  args
    .map((msg) => {
      const type = typeof msg;
      if (type === "null") {
        return "null";
      } else if (type === "function") {
        return `[function ${msg?.name || "anonymous"}()]`;
      } else if (type === "object") {
        if (msg instanceof Error) {
          return msg.message;
        }
        try {
          return `\n${JSON.stringify(msg, Object.getOwnPropertyNames(msg), 2)}\n`;
        } catch (error) {
          return "object could not be stringified";
        }
      } else {
        return msg;
      }
    })
    .join(" ");

const log = (level, ...args) => {
  const message = formatMessage(...args);
  if (checkIsDebug()) {
    console.log(message);
  }
  FileLogger.write(level, message);
};

const logAPIError = (message, error) => {
  if (error?.response) {
    addErrorLog(message, "received API error:", error.response?.status, error?.response?.data);
  } else if (error?.request) {
    // No response was received
    addErrorLog(message, "no response received:", error?.response?.data || error?.message);
  } else {
    // Error in setting up the request
    addErrorLog(message, "couldn't send request:", error?.response?.data || error?.message || error);
  }
};

const addDebugLog = (...args) => {
  const isDebugAllowed = store.getState().global?.debugLogPermission;
  if (isDebugAllowed) {
    log(LogLevel.Debug, ...args);
  }
};

const addInfoLog = (...args) => log(LogLevel.Info, ...args);
const addWarnLog = (...args) => log(LogLevel.Warning, ...args);
const addErrorLog = (...args) => log(LogLevel.Error, ...args);

export { configureFileLogger, showLogFilePaths, addDebugLog, addInfoLog, addWarnLog, addErrorLog, logAPIError };
