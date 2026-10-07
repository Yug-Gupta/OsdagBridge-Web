from fastapi import APIRouter
from app.models.schemas import ValidateFieldRequest, ValidateFieldResponse

router = APIRouter(prefix="/validate", tags=["Validation"])
@router.post("/field", response_model=ValidateFieldResponse)
@router.post("", response_model=ValidateFieldResponse)
def validate_field(payload: ValidateFieldRequest):
    """
    Validates a single input field against IRC / Osdag design constraints
    """
    key = payload.key
    val = payload.value
<<<<<<< HEAD

    if key in {"Span", "geometry.span"}:
        try:
            num = float(val)
            if num < 12.0 or num > 60.0:
                return ValidateFieldResponse(
                    valid=False,
                    corrected_value=30.0,
                    message="Span must be between 12.0 m and 60.0 m."
                )
        except (ValueError, TypeError):
            return ValidateFieldResponse(valid=False, message="Span must be a numeric value.")

    if key in {"Carriageway_Width", "geometry.carriageway_width"}:
        try:
            num = float(val)
            if num < 4.25 or num > 24.0:
                return ValidateFieldResponse(
                    valid=False,
                    corrected_value=7.5,
                    message="Carriageway width must be between 4.25 m and 24.0 m."
                )
        except (ValueError, TypeError):
            return ValidateFieldResponse(valid=False, message="Width must be numeric.")
=======
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
>>>>>>> yashvi-endpoints

