from fastapi import APIRouter, Query
from app.models.schemas import LocationStateResponse, LocationStationResponse, LocationDataResponse

router = APIRouter(prefix="/location", tags=["Project Location"])

@router.get("/states", response_model=LocationStateResponse)
def get_states():
    """Returns the web API's built-in state list."""
    return LocationStateResponse(states=[
        "Maharashtra", "Gujarat", "Karnataka", "Tamil Nadu", "Delhi", "Punjab", "Rajasthan", "Uttar Pradesh"
    ])

@router.get("/stations", response_model=LocationStationResponse)
def get_stations(state: str = Query(..., description="Name of the State")):
    """Returns stations/districts for the selected state."""
    stations_by_state = {
        "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
        "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
        "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangalore"],
        "Delhi": ["New Delhi", "North Delhi", "South Delhi"]
    }
    return LocationStationResponse(state=state, stations=stations_by_state.get(state, ["City Center"]))

@router.get("/details", response_model=LocationDataResponse)
def get_location_details(state: str = Query(...), station: str = Query(...)):
    """Returns IRC weather, wind speed, and seismic zone for selected station."""
    # Standard IRC 6 references
    demo_db = {
        "Mumbai": {"wind": 44.0, "zone": "Zone III", "tmax": 38.0, "tmin": 14.0},
        "Pune": {"wind": 39.0, "zone": "Zone III", "tmax": 40.0, "tmin": 10.0},
        "Ahmedabad": {"wind": 39.0, "zone": "Zone III", "tmax": 44.0, "tmin": 8.0},
        "New Delhi": {"wind": 47.0, "zone": "Zone IV", "tmax": 46.0, "tmin": 4.0},
    }
    data = demo_db.get(station, {"wind": 44.0, "zone": "Zone II", "tmax": 42.0, "tmin": 10.0})
    return LocationDataResponse(
        state=state,
        station=station,
        basic_wind_speed=data["wind"],
        seismic_zone=data["zone"],
        max_temperature=data["tmax"],
        min_temperature=data["tmin"]
    )
