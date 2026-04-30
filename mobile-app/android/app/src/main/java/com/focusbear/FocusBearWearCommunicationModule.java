package com.focusbear;

import android.net.Uri;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.tasks.Tasks;
import com.google.android.gms.wearable.CapabilityClient;
import com.google.android.gms.wearable.CapabilityInfo;
import com.google.android.gms.wearable.DataClient;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.MessageClient;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.Wearable;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import kotlin.text.Charsets;

public class FocusBearWearCommunicationModule extends ReactContextBaseJavaModule implements MessageClient.OnMessageReceivedListener, LifecycleEventListener, DataClient.OnDataChangedListener, CapabilityClient.OnCapabilityChangedListener {
    private static final String PATH_SEND_OBJECT = "/sendObject";
    private static final String PATH_SEND_DATA = "/sendData";
    private static final String PATH_SEND = "/send";

    private static ReactApplicationContext context = null;

    public FocusBearWearCommunicationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addLifecycleEventListener(this);
        context = reactContext;
    }

    @Override
    public void onHostResume() {
        try {
            Wearable.getDataClient(context).addListener(this);
            Wearable.getMessageClient(context).addListener(this);
            Wearable.getCapabilityClient(context).addListener(this, Uri.parse("wear://"), CapabilityClient.FILTER_REACHABLE);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onHostPause() {
        try {
            Wearable.getMessageClient(context).removeListener(this);
            Wearable.getDataClient(context).removeListener(this);
            Wearable.getCapabilityClient(context).removeListener(this);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onHostDestroy() {
        try {
            Wearable.getMessageClient(context).removeListener(this);
            Wearable.getDataClient(context).removeListener(this);
            Wearable.getCapabilityClient(context).removeListener(this);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @NonNull
    @Override
    public String getName() {
        return "FocusBearWearCommunicationModule";
    }

    @Override
    public void onMessageReceived(@NonNull MessageEvent messageEvent) {
        String convertedString = new String(messageEvent.getData(), Charsets.UTF_8);
        WritableMap writableMap = Arguments.createMap();
        writableMap.putString("message", convertedString);
        sendEvent(context, "sendDataToRN", writableMap);
    }

    private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
    }

    @ReactMethod
    public void sendObjectToWearApp(ReadableMap readableMap, boolean value) throws IOException, ExecutionException, InterruptedException {
        try {
            Map<String, Object> javaMap = toJavaMap(readableMap);
            byte[] byteArray = mapToByteArray(javaMap);
            final List<Node> nodes = Tasks.await(Wearable.getNodeClient(context).getConnectedNodes());
            if (!nodes.isEmpty()) {
                for (Node node : nodes) {
                    if (value) {
                        Wearable.getMessageClient(context).sendMessage(node.getId(), PATH_SEND_OBJECT, byteArray);
                    } else {
                        Wearable.getMessageClient(context).sendMessage(node.getId(), PATH_SEND_OBJECT, byteArray);
                        Wearable.getMessageClient(context).sendMessage(node.getId(), PATH_SEND, "".getBytes());
                    }
                }
            }
        } catch (Exception e) {}
    }

    @ReactMethod
    public void sendDataToWearApp(String name) throws IOException {
        if(!name.isEmpty()){
            try {
                final List<Node> nodes = Tasks.await(Wearable.getNodeClient(context).getConnectedNodes());
                if (!nodes.isEmpty()) {
                    for (Node node : nodes) {
                        Wearable.getMessageClient(context).sendMessage(node.getId(), PATH_SEND_DATA,name.getBytes());
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private Map<String, Object> toJavaMap(ReadableMap readableMap) {
        Map<String, Object> javaMap = new HashMap<>();

        ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            switch (readableMap.getType(key)) {
                case Null:
                    javaMap.put(key, null);
                    break;
                case Boolean:
                    javaMap.put(key, readableMap.getBoolean(key));
                    break;
                case Number:
                    javaMap.put(key, readableMap.getDouble(key));
                    break;
                case String:
                    javaMap.put(key, readableMap.getString(key));
                    break;
                case Map:
                    javaMap.put(key, toJavaMap(readableMap.getMap(key)));
                    break;
                case Array:
                    javaMap.put(key, toJavaArray(readableMap.getArray(key)));
                    break;
            }
        }

        return javaMap;
    }

    private List<Object> toJavaArray(ReadableArray readableArray) {
        List<Object> javaList = new ArrayList<>();
        for (int i = 0; i < readableArray.size(); i++) {
            switch (readableArray.getType(i)) {
                case Null:
                    javaList.add(null);
                    break;
                case Boolean:
                    javaList.add(readableArray.getBoolean(i));
                    break;
                case Number:
                    javaList.add(readableArray.getDouble(i));
                    break;
                case String:
                    javaList.add(readableArray.getString(i));
                    break;
                case Map:
                    javaList.add(toJavaMap(readableArray.getMap(i)));
                    break;
                case Array:
                    javaList.add(toJavaArray(readableArray.getArray(i)));
                    break;
            }
        }
        return javaList;
    }

    public static byte[] mapToByteArray(Map<String, Object> map) throws IOException {
        ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
        ObjectOutputStream objectStream = new ObjectOutputStream(byteStream);

        // Write the map to the ObjectOutputStream
        objectStream.writeObject(map);

        // Close the streams
        objectStream.close();
        byteStream.close();

        // Get the byte array
        return byteStream.toByteArray();
    }

    @Override
    public void onDataChanged(@NonNull DataEventBuffer dataEventBuffer) {

    }

    @Override
    public void onCapabilityChanged(@NonNull CapabilityInfo capabilityInfo) {

    }
}
