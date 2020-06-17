package com.uos.gohome.retrofit2;

import com.google.gson.annotations.SerializedName;

public class SignupData {
    @SerializedName("profile")
    private SignupProfile profile;

    public SignupData(String username, String password, String email, String nickname, String address, String detail_address, double latitude, double longitude) {
        this.profile = new SignupProfile(username, password, email, nickname, address, detail_address, latitude, longitude);
    }

    public SignupProfile getProfile() {
        return profile;
    }

    public void setProfile(SignupProfile profile) {
        this.profile = profile;
    }

    private class SignupProfile {
        @SerializedName("username")
        private String username;
        @SerializedName("password")
        private String password;
        @SerializedName("email")
        private String email;
        @SerializedName("nickname")
        private String nickname;
        @SerializedName("address")
        private String address;
        @SerializedName("detail_address")
        private String detail_address;
        @SerializedName("latitude")
        private double latitude;
        @SerializedName("longitude")
        private double longitude;

        public SignupProfile(String username, String password, String email, String nickname, String address, String detail_address, double latitude, double longitude) {
            this.username = username;
            this.password = password;
            this.email = email;
            this.nickname = nickname;
            this.address = address;
            this.detail_address = detail_address;
            this.latitude = latitude;
            this.longitude = longitude;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getNickname() {
            return nickname;
        }

        public void setNickname(String nickname) {
            this.nickname = nickname;
        }

        public String getAddress() {
            return address;
        }

        public String getDetail_address() {
            return detail_address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public void setDetail_address(String detail_address) {
            this.detail_address = detail_address;
        }

        public double getLatitude() { return latitude; }

        public void setLatitude(double latitude) { this.latitude = latitude; }

        public double getLongitude() { return longitude; }

        public void setLongitude(double longitude) { this.longitude = longitude; }
    }
}
