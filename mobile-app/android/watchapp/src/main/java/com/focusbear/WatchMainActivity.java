package com.focusbear;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.AppCompatButton;
import androidx.appcompat.widget.AppCompatTextView;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.wear.ambient.AmbientModeSupport;

import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.wearable.CapabilityClient;
import com.google.android.gms.wearable.CapabilityInfo;
import com.google.android.gms.wearable.DataClient;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.MessageClient;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.Wearable;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import kotlin.text.Charsets;

public class WatchMainActivity extends AppCompatActivity implements AmbientModeSupport.AmbientCallbackProvider, MessageClient.OnMessageReceivedListener, DataClient.OnDataChangedListener, CapabilityClient.OnCapabilityChangedListener {
    private static final String SEND_DATA_TO_RN = "sendDataToRN";
    private static final String ROUTINE_HAS_BEEN_POSTPONED = "Routine_has_been_postponed";
    private static final String SET_ACTIVITY_CONTINUE_ON_YOUR_PHONE = "SET_ACTIVITY_CONTINUE_ON_YOUR_PHONE";
    private String node = null;
    private AppCompatButton buttonStart, btnCantDoIT, btnAlreadyDidIT;
    private AppCompatTextView title, timerText, loadingText;
    private ConstraintLayout layoutSkipped;
    private CountDownTimer timer = null;
    private Long timeRemaining = 0L;
    private Long timeElapsed = 0L;
    private Map<String, Object> javaMap;
    private LocaleStrings localeStrings;
    private android.widget.ProgressBar loadingIndicator;
    private boolean isLoading = true;

    private static final String PATH_SEND_OBJECT = "/sendObject";
    private static final String PATH_SEND_DATA = "/sendData";
    private static final String PATH_SEND = "/send";

    private AmbientModeSupport.AmbientController ambientController;

    @SuppressLint("MissingInflatedId")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_watch_main);
        buttonStart = findViewById(R.id.btnStart);
        title = findViewById(R.id.titleText);
        timerText = findViewById(R.id.timerText);
        layoutSkipped = findViewById(R.id.layoutSkipped);
        btnCantDoIT = findViewById(R.id.btnCantDoIT);
        btnAlreadyDidIT = findViewById(R.id.btnAlreadyDidIT);
        loadingIndicator = findViewById(R.id.loadingIndicator);
        loadingText = findViewById(R.id.loadingText);
        
        // Show loading indicator initially
        if (loadingIndicator != null) {
            loadingIndicator.setVisibility(View.VISIBLE);
        }
        if (loadingText != null) {
            loadingText.setVisibility(View.VISIBLE);
        }
        // Hide other UI elements initially
        title.setVisibility(View.GONE);
        timerText.setVisibility(View.GONE);
        buttonStart.setVisibility(View.GONE);

        ambientController = AmbientModeSupport.attach(this);

        localeStrings = new LocaleStrings();
        String deviceLanguage = Locale.getDefault().getLanguage();
        updateResources(getApplicationContext(), deviceLanguage);

        initGoogleClient();
        clickListeners();
        
        // Set timeout to hide loading after 5 seconds if no data received
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                if (isLoading) {
                    isLoading = false;
                    if (loadingIndicator != null) {
                        loadingIndicator.setVisibility(View.GONE);
                    }
                    if (loadingText != null) {
                        loadingText.setVisibility(View.GONE);
                    }
                    title.setVisibility(View.VISIBLE);
                }
            }
        }, 5000);
    }

    private void clickListeners() {
        buttonStart.setOnClickListener(view -> {
            boolean isStartRoutineAction = title.getText().equals(getString(R.string.start_routine));
            boolean isNextRoutineAction = buttonStart.getText().equals(getString(R.string.next));
            boolean isStartAction = buttonStart.getText().equals(getString(R.string.start));
            boolean isPauseRoutineAction = buttonStart.getText().equals(getString(R.string.pause));
            boolean isResumeRoutineAction = buttonStart.getText().equals(getString(R.string.resume));
            boolean isRoutinePostPoneAction = title.getText().equals(getString(R.string.routinePostPond));
            if (isStartRoutineAction) {
                Wearable.getMessageClient(this).sendMessage(node, SEND_DATA_TO_RN, getString(R.string.start_routine).getBytes());
            } else if (isNextRoutineAction) {
                Wearable.getMessageClient(this).sendMessage(node, SEND_DATA_TO_RN, getString(R.string.next).getBytes());
            } else if (isStartAction) {
                Wearable.getMessageClient(this).sendMessage(node, SEND_DATA_TO_RN, getString(R.string.start).getBytes());
            } else if (isPauseRoutineAction) {
                Wearable.getMessageClient(this).sendMessage(node, SEND_DATA_TO_RN, getString(R.string.pause).getBytes());
                buttonStart.setText(localeStrings.getStaticString("resume"));
                pauseTimer();
            } else if (isResumeRoutineAction) {
                if (isRoutinePostPoneAction) {
                    Wearable.getMessageClient(this).sendMessage(node, SEND_DATA_TO_RN, ROUTINE_HAS_BEEN_POSTPONED.getBytes());
                } else {
                    Wearable.getMessageClient(this).sendMessage(node, SEND_DATA_TO_RN, getString(R.string.resume).getBytes());
                    buttonStart.setText(localeStrings.getStaticString("pause"));
                    resumeTimer();
                }
            }
        });
        btnCantDoIT.setOnClickListener(view -> {
            Wearable.getMessageClient(this).sendMessage(node, SEND_DATA_TO_RN, getString(R.string.canDoIT).getBytes());
        });
        btnAlreadyDidIT.setOnClickListener(view -> {
            Wearable.getMessageClient(this).sendMessage(node, SEND_DATA_TO_RN, getString(R.string.didIt).getBytes());
        });
    }

    private void updateResources(Context context, String language) {
        Locale locale = new Locale(language);
        Locale.setDefault(locale);
        Resources resources = context.getResources();
        Configuration configuration = resources.getConfiguration();
        configuration.locale = locale;
        resources.updateConfiguration(configuration, resources.getDisplayMetrics());
    }

    private void timer() {
        if (timer == null) {
            timer = new CountDownTimer(timeRemaining - timeElapsed, 1000) {
                @Override
                public void onTick(long millisUntilFinished) {
                    timeElapsed = timeRemaining - millisUntilFinished;
                    updateTimerDisplay(millisUntilFinished);
                }

                @Override
                public void onFinish() {
                    timer = null;
                    timeElapsed = 0L;
                }
            };
            timer.start();
        }
    }

    private void updateTimerDisplay(Long millisUntilFinished) {
        long minutes = (millisUntilFinished / 1000) / 60;
        long seconds = (millisUntilFinished / 1000) % 60;
        String timeFormatted = String.format("%02d:%02d", minutes, seconds);
        timerText.setText(timeFormatted);
    }

    private void pauseTimer() {
        if (timer != null) {
            timer.cancel();
            timer = null;
        }
    }

    private void resumeTimer() {
        timer();
    }

    private void initGoogleClient() {
        try {
            Wearable.getDataClient(this).addListener(this);
            Wearable.getMessageClient(this).addListener(this);
            Wearable.getCapabilityClient(this)
                    .addListener(this, Uri.parse("wear://"), CapabilityClient.FILTER_REACHABLE);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    @SuppressLint("SetTextI18n")
    @Override
    public void onMessageReceived(@NonNull MessageEvent messageEvent) {
        // Hide loading indicator when first message is received
        if (isLoading) {
            isLoading = false;
            if (loadingIndicator != null) {
                loadingIndicator.setVisibility(View.GONE);
            }
            if (loadingText != null) {
                loadingText.setVisibility(View.GONE);
            }
            title.setVisibility(View.VISIBLE);
        }
        
        if (Objects.equals(node, null))
            node = messageEvent.getSourceNodeId();
        if (messageEvent.getPath().equals(PATH_SEND_OBJECT)) {
            try {
                javaMap = byteArrayToMap(messageEvent.getData());

                double value = Double.parseDouble(Objects.requireNonNull(javaMap.get("duration_seconds")).toString());
                int timeDuration = (int) value;
                timeRemaining = 0L;
                timeElapsed = 0L;
                timeRemaining = (long) timeDuration * 1000;
                timerText.setVisibility(View.GONE);
                buttonStart.setText(localeStrings.getStaticString("start"));
                String[] placeholderValPairs = new String[]{
                        "{activityName}:" + javaMap.get("name"),
                };
                title.setText(localeStrings.getDynamicString("activity", placeholderValPairs));
            } catch (IOException | ClassNotFoundException e) {
                throw new RuntimeException(e);
            }
        }
        if (messageEvent.getPath().equals(PATH_SEND_DATA)) {
            String convertedString = new String(messageEvent.getData(), Charsets.UTF_8);
            boolean isStatusFinished = convertedString.equals(getString(R.string.finishedCapital));
            boolean isStatusPause = convertedString.equals(getString(R.string.pause));
            boolean isStatusResume = convertedString.equals(getString(R.string.resume));
            boolean isStatusSkipped = convertedString.equals(getString(R.string.skipped));
            boolean isStatusRoutinePostPond = convertedString.equals(ROUTINE_HAS_BEEN_POSTPONED);
            boolean isContinueOnPhone = convertedString.equals(SET_ACTIVITY_CONTINUE_ON_YOUR_PHONE);
            if (isContinueOnPhone) {
                // Hide loading indicator if still showing
                if (isLoading) {
                    isLoading = false;
                    if (loadingIndicator != null) {
                        loadingIndicator.setVisibility(View.GONE);
                    }
                    if (loadingText != null) {
                        loadingText.setVisibility(View.GONE);
                    }
                }
                title.setVisibility(View.GONE);
                timerText.setVisibility(View.VISIBLE);
                timerText.setText(localeStrings.getStaticString("continueOnPhone"));
                layoutSkipped.setVisibility(View.GONE);
                buttonStart.setVisibility(View.GONE);
            }
            else if (isStatusFinished) {
                String[] placeholderValPairs = new String[]{
                        "{activityName}:" + javaMap.get("name"),
                };
                title.setVisibility(View.VISIBLE);
                title.setText(localeStrings.getDynamicString("activityFinished", placeholderValPairs));
                timerText.setVisibility(View.GONE);
                layoutSkipped.setVisibility(View.GONE);
                buttonStart.setVisibility(View.VISIBLE);
                buttonStart.setText(localeStrings.getStaticString("next"));
            } else if (isStatusPause) {
                buttonStart.setText(localeStrings.getStaticString("pause"));
                resumeTimer();
            } else if (isStatusResume) {
                buttonStart.setText(localeStrings.getStaticString("resume"));
                pauseTimer();
            } else if (isStatusSkipped) {
                buttonStart.setVisibility(View.GONE);
                timerText.setVisibility(View.GONE);
                layoutSkipped.setVisibility(View.VISIBLE);
            } else if (isStatusRoutinePostPond) {
                buttonStart.setVisibility(View.VISIBLE);
                timerText.setVisibility(View.GONE);
                title.setText(localeStrings.getStaticString("routinePostPond"));
                buttonStart.setText(localeStrings.getStaticString("resume"));
            } else {
                try {
                    javaMap = byteArrayToMap(messageEvent.getData());

                    double value = Double.parseDouble(Objects.requireNonNull(javaMap.get("duration_seconds")).toString());
                    int timeDuration = (int) value;
                    timeRemaining = 0L;
                    timeElapsed = 0L;
                    timeRemaining = (long) timeDuration * 1000;
                    timerText.setVisibility(View.GONE);
                    buttonStart.setText(localeStrings.getStaticString("start"));
                    String[] placeholderValPairs = new String[]{
                            "{activityName}:" + javaMap.get("name"),
                    };
                    title.setText(localeStrings.getDynamicString("activity", placeholderValPairs));
                } catch (IOException | ClassNotFoundException e) {
                    throw new RuntimeException(e);
                }
            }
        }
        if (messageEvent.getPath().equals(PATH_SEND)) {
            double value = Double.parseDouble(Objects.requireNonNull(javaMap.get("duration_seconds")).toString());
            int timeDuration = (int) value;
            if (javaMap.containsKey("completion_requirements")) {
                buttonStart.setVisibility(View.GONE);
                timerText.setVisibility(View.GONE);
            } else {
                if (timeDuration == 1) {
                    buttonStart.setVisibility(View.GONE);
                    timerText.setVisibility(View.GONE);
                } else {
                    timerText.setVisibility(View.VISIBLE);
                    buttonStart.setText(localeStrings.getStaticString("pause"));
                    buttonStart.setVisibility(View.VISIBLE);
                    timer();
                }
            }
        }
    }

    @Override
    protected void onStop() {
        disconnectGoogleApiClient();
        super.onStop();
    }

    private void disconnectGoogleApiClient() {
        try {
            Wearable.getDataClient(this).removeListener(this);
            Wearable.getMessageClient(this).removeListener(this);
            Wearable.getCapabilityClient(this).removeListener(this);
        } catch (Exception e) {
            e.printStackTrace();
        }
        buttonStart.setEnabled(false);
        node = null;
    }

    @Override
    public void onCapabilityChanged(@NonNull CapabilityInfo capabilityInfo) {

    }

    @Override
    public void onDataChanged(@NonNull DataEventBuffer dataEventBuffer) {

    }

    @Override
    public AmbientModeSupport.AmbientCallback getAmbientCallback() {
        return new MyAmbientCallback();
    }

    private class MyAmbientCallback extends AmbientModeSupport.AmbientCallback {
        @Override
        public void onEnterAmbient(Bundle ambientDetails) {
            super.onEnterAmbient(ambientDetails);
        }

        @Override
        public void onUpdateAmbient() {
            super.onUpdateAmbient();
        }

        @Override
        public void onExitAmbient() {
            super.onExitAmbient();
        }
    }

    private Map<String, Object> byteArrayToMap(byte[] byteArray) throws IOException, ClassNotFoundException {
        ByteArrayInputStream byteStream = new ByteArrayInputStream(byteArray);
        ObjectInputStream objectStream = new ObjectInputStream(byteStream);
        Object object = objectStream.readObject();
        objectStream.close();
        byteStream.close();
        if (object instanceof Map) {
            return (Map<String, Object>) object;
        } else {
            throw new IOException("The deserialized object is not a Map");
        }
    }
}
