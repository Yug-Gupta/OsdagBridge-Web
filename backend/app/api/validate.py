from fastapi import APIRouter
from app.models.schemas import ValidateFieldRequest, ValidateFieldResponse
import sys
from pathlib import Path

CORE_DIR = Path(__file__).resolve().parents[4] / "osdag-admin_OsdagBridge_dev" / "OsdagBridge" / "src"
print("CORE_DIR =", CORE_DIR)
print("CORE EXISTS =", CORE_DIR.exists())

if CORE_DIR.exists() and str(CORE_DIR) not in sys.path:
    sys.path.insert(0, str(CORE_DIR))

router = APIRouter(prefix="/validate", tags=["Validation"])

@router.post("", response_model=ValidateFieldResponse)
def validate_field(payload: ValidateFieldRequest):
    """
    Validates a single input field against IRC / Osdag design constraints
    """
    key = payload.key
    val = payload.value

    # Try running the actual core validator if available
    try:
        from osdagbridge.core.bridge_types.plate_girder.validator import BridgeInputValidator
        validator = BridgeInputValidator()
        result = validator.validate_basic_inputs(key, payload.all_inputs or {key: val})
        if result is not None:
            corrected, msg = result
            return ValidateFieldResponse(valid=False, corrected_value=corrected, message=msg)
        return ValidateFieldResponse(valid=True)
    
    except Exception as e:
        print("Validator error:", e)
        raise

