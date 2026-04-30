import { applyMiddleware, createStore } from "redux";
import { persistReducer, persistStore } from "redux-persist";
import thunk from "redux-thunk";
import { rootReducer } from "@/reducers";
import AsyncStorage from "@react-native-async-storage/async-storage";

const persistConfig = {
  timeout: 2000,
  key: "root",
  storage: AsyncStorage,
  blacklist: ["error", "modal"],
};

const middlewares = [thunk];

export const store = createStore(persistReducer(persistConfig, rootReducer), applyMiddleware(...middlewares));

export const persistor = persistStore(store);

export const callAction = (action) => {
  store.dispatch(action);
};
