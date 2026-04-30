package com.focusbear;

/**
 * Created by Nayan Tala on 04/01/24.
 */

import java.util.Locale;
import java.util.ResourceBundle;
public class LocaleStrings {
    private static Locale currentLocale;
    private static ResourceBundle strings;

    public LocaleStrings()  {
        String language = Locale.getDefault().getLanguage();
        String country = Locale.getDefault().getCountry();

        currentLocale = new Locale(language, country);
        strings = ResourceBundle.getBundle("Strings", currentLocale);
    }

    public Locale getCurrentLocale() {
        return currentLocale;
    }

    public ResourceBundle getLocaleBundle() {
        return strings;
    }

    public String getStaticString(String keyName){
        return strings.getString(keyName);
    }

    /*
     * param arrPlaceholdersValues should contain ["{placeholderName}:textValue",..]
     *  - see strings.properties file for placeholder names
     */
    public String getDynamicString(String keyName, String[] arrPlaceholdersValues){
        String text = strings.getString(keyName);

        for (String keyValPair: arrPlaceholdersValues) {
            String[] arrKeyVal = keyValPair.split(":");
            String placeholder = arrKeyVal[0];
            String value = arrKeyVal[1];
            text = text.replace(placeholder,value);
        }

        return text;
    }

}
