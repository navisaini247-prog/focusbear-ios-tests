package com.focusbear;

public class SupportedBrowserConfig {
    private String packageName;
    private String addressBarId;

    public SupportedBrowserConfig(String packageName, String addressBarId) {
        this.packageName = packageName;
        this.addressBarId = addressBarId;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public String getAddressBarId() {
        return addressBarId;
    }

    public void setAddressBarId(String addressBarId) {
        this.addressBarId = addressBarId;
    }
}