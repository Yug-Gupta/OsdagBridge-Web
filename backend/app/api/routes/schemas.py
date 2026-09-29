import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/schema", tags=["Schemas"])
PUBLIC_DIR = Path(__file__).resolve().parents[4] / "frontend" / "public"


def _load_fixture(file_name: str):
    fixture_path = PUBLIC_DIR / file_name
    try:
        with fixture_path.open(encoding="utf-8") as fixture:
            return json.load(fixture)
    except (OSError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=500, detail=f"Unable to load schema fixture: {file_name}") from error


@router.get("/additional-inputs")
def get_additional_inputs_schema():
    return _load_fixture("mock-additional-inputs.json")


@router.get("/result-dialogs")
def get_result_dialog_schemas():
    return _load_fixture("mock-result-schemas.json")
