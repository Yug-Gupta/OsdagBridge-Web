from fastapi import APIRouter
from app.models.schemas import ValidateFieldRequest, ValidateFieldResponse

router = APIRouter(prefix="/validate", tags=["Validation"])

@router.post("/field", response_model=ValidateFieldResponse)
@router.post("", response_model=ValidateFieldResponse)
def validate_field(payload: ValidateFieldRequest):
    """
    Validates a single input field against IRC / Osdag design constraints.
    TODO: Connect to BridgeInputValidator in validator.py
    """
    key = payload.key
    val = payload.value

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

    return ValidateFieldResponse(valid=True)
