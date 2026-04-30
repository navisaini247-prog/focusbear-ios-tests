import { store } from "@/store";
import { customRequest } from "./CustomMethod";
import { addErrorLog } from "./FileLogger";

const BaseUrl = "https://api.focusbear.io/";
const BaseAwsUrl = "https://api.aws.focusbear.io/";

export const APIMethod = ({ endpoint, method, body, bearerToken, noToken, ...config }) => {
  const userState = store?.getState()?.user;
  const globalState = store?.getState()?.global;
  const accessToken = bearerToken || userState?.accessToken;
  const deviceId = userState?.deviceData?.id;

  // Use `noToken` if there isn't supposed to be a token
  if (!accessToken && !noToken) {
    addErrorLog("<===  No access token found  ===>");
    return Promise.reject("No access token found");
  }

  let headers = {
    ...(!noToken && { Authorization: `Bearer ${accessToken}` }),
    ...(deviceId && { "device-id": deviceId }),
  };

  return customRequest({
    baseURL: config?.baseURL || (globalState?.isAwsBackendEndpointActivated ? BaseAwsUrl : BaseUrl),
    url: endpoint || "",
    method: method || "POST",
    data: body,
    responseType: "json",
    headers,
    ...config,
  });
};
