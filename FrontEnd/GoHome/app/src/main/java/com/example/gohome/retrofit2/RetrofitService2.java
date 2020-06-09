package com.example.gohome.retrofit2;

import com.google.gson.JsonObject;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;

public interface RetrofitService2 {
    @GET("api/bikestops")
    Call<BikestopData> getBikestops();
}
