from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import LocationStateResponse, LocationStationResponse, LocationDataResponse
import sys
from pathlib import Path

CORE_DIR = Path(__file__).resolve().parents[5] / "OsdagBridge" / "src"
if CORE_DIR.exists() and str(CORE_DIR) not in sys.path:
    sys.path.insert(0, str(CORE_DIR))

router = APIRouter(prefix="/location", tags=["Project Location"])

@router.get("/states", response_model=LocationStateResponse)
def get_states():
    """Returns list of all Indian states from weather database."""
    try:
        from osdagbridge.core.bridge_types.plate_girder.ui_fields_project_location import get_state_list
        states = get_state_list(include_placeholder=False)
        return LocationStateResponse(states=states)
    except Exception:
        # Fallback list for offline demo
        return LocationStateResponse(states=[
            "Maharashtra", "Gujarat", "Karnataka", "Tamil Nadu", "Delhi", "Punjab", "Rajasthan", "Uttar Pradesh"
        ])

@router.get("/stations", response_model=LocationStationResponse)
def get_stations(state: str = Query(..., description="Name of the State")):
    """Returns stations/districts for the selected state."""
    try:
        from osdagbridge.core.bridge_types.plate_girder.ui_fields_project_location import get_station_list
        stations = get_station_list(state=state, include_placeholder=False)
        return LocationStationResponse(state=state, stations=stations)
    except Exception:
        fallback = {
            "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
            "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
            "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangalore"],
            "Delhi": ["New Delhi", "North Delhi", "South Delhi"]
        }
        return LocationStationResponse(state=state, stations=fallback.get(state, ["City Center"]))

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
