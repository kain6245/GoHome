package com.example.gohome.main;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;

import android.util.Log;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.Toast;

import com.example.gohome.MainActivity;
import com.example.gohome.R;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.skt.Tmap.TMapPoint;
import com.skt.Tmap.TMapPolyLine;
import com.skt.Tmap.TMapView;

import java.util.ArrayList;

import static java.lang.Math.max;
import static java.lang.Math.min;

/**
 * A simple {@link Fragment} subclass.
 * Use the {@link RouteFragment#newInstance} factory method to
 * create an instance of this fragment.
 */
public class RouteFragment extends Fragment {
    // TODO: Rename parameter arguments, choose names that match
    // the fragment initialization parameters, e.g. ARG_ITEM_NUMBER
    private static final String ARG_PARAM1 = "param1";
    private static final String ARG_PARAM2 = "param2";

    private FloatingActionButton cameraBtn;
    private FloatingActionButton shareBtn;

    private TMapPoint points[];

    // TODO: Rename and change types of parameters
    private String mParam1;
    private String mParam2;

    public RouteFragment() {
        // Required empty public constructor
    }

    /**
     * Use this factory method to create a new instance of
     * this fragment using the provided parameters.
     *
     * @param param1 Parameter 1.
     * @param param2 Parameter 2.
     * @return A new instance of fragment RouteFragment.
     */
    // TODO: Rename and change types and number of parameters
    public static RouteFragment newInstance(String param1, String param2) {
        RouteFragment fragment = new RouteFragment();
        Bundle args = new Bundle();
        args.putString(ARG_PARAM1, param1);
        args.putString(ARG_PARAM2, param2);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            mParam1 = getArguments().getString(ARG_PARAM1);
            mParam2 = getArguments().getString(ARG_PARAM2);
        }

        // init variable

        // use onOptionsItemSelected in Fragment
        setHasOptionsMenu(true);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_route, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // toolbar 생성
        Toolbar toolbar = (Toolbar)view.findViewById(R.id.toolbar);
        ((AppCompatActivity)getActivity()).setSupportActionBar(toolbar);
        ((AppCompatActivity)getActivity()).getSupportActionBar().setDisplayShowTitleEnabled(false); // title 제거
        ((AppCompatActivity)getActivity()).getSupportActionBar().setDisplayHomeAsUpEnabled(true); // 뒤로가기 버튼 생성


        // tmapview 추가
        TMapView tMapView = new TMapView(getContext());
        LinearLayout tMapLayout = (LinearLayout)view.findViewById(R.id.route_tmap);
        tMapLayout.addView(tMapView);


        // find view by id
        cameraBtn = (FloatingActionButton) view.findViewById(R.id.route_camera_btn);


        // event
        cameraBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast.makeText(getActivity(), "AR Open", Toast.LENGTH_SHORT).show();
                Intent intent = new Intent(getActivity(), com.example.gohome.testActivity.class);
                startActivity(intent);
            }
        });

        TMapPolyLine polyLine = ((MainActivity)getActivity()).getPolyLine();
        tMapView.addTMapPolyLine("fastestPath", polyLine);
        double minLatitude = getMinLatitude(polyLine.getLinePoint());
        double maxLatitude = getMaxLatitude(polyLine.getLinePoint());
        double minLongitude = getMinLongitude(polyLine.getLinePoint());
        double maxLongitude = getMaxLongitude(polyLine.getLinePoint());
        tMapView.setCenterPoint((minLongitude+maxLongitude)/2, (minLatitude+maxLatitude)/2);
        tMapView.zoomToSpan(maxLatitude-minLatitude, maxLongitude-minLongitude);
        tMapView.setIconVisibility(true);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch(item.getItemId()) {
            // click back btn
            case android.R.id.home :
                NavHostFragment.findNavController(RouteFragment.this)
                        .navigate(R.id.action_RouteFragment_to_MapFragment);
                return true;
            default:
        }
        return super.onOptionsItemSelected(item);
    }

    double getMinLatitude(ArrayList<TMapPoint> tMapPoints) {
        double ret = 999;
        for(TMapPoint tMapPoint : tMapPoints) {
            ret = min(ret, tMapPoint.getLatitude());
        }
        return ret;
    }

    double getMaxLatitude(ArrayList<TMapPoint> tMapPoints) {
        double ret = -999;
        for(TMapPoint tMapPoint : tMapPoints) {
            ret = max(ret, tMapPoint.getLatitude());
        }
        return ret;
    }

    double getMinLongitude(ArrayList<TMapPoint> tMapPoints) {
        double ret = 999;
        for(TMapPoint tMapPoint : tMapPoints) {
            ret = min(ret, tMapPoint.getLongitude());
        }
        return ret;
    }

    double getMaxLongitude(ArrayList<TMapPoint> tMapPoints) {
        double ret = -999;
        for(TMapPoint tMapPoint : tMapPoints) {
            ret = max(ret, tMapPoint.getLongitude());
        }
        return ret;
    }
}
