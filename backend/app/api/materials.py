from fastapi import APIRouter
import sys
from pathlib import Path

# Add core src to path if running side-by-side with OsdagBridge
CORE_DIR = Path(__file__).resolve().parents[4] / "osdag-admin_OsdagBridge_dev" / "OsdagBridge" / "src"



if CORE_DIR.exists() and str(CORE_DIR) not in sys.path:
    sys.path.insert(0, str(CORE_DIR))



router = APIRouter(prefix="/materials", tags=["Materials"])

@router.get("/steel")
def get_steel_options():
    try:
        from osdagbridge.core.bridge_types.plate_girder.defaults import steel_properties

        return steel_properties
    except ImportError as e:
        print("CORE IMPORT ERROR:", e)
        raise

@router.get("/concrete")
def get_concrete_options():
    try:
        from osdagbridge.core.bridge_types.plate_girder.defaults import concrete_properies

        return concrete_properies
    except ImportError as e:
        print("CORE IMPORT ERROR:", e)
        raise
