from fastapi import APIRouter
from typing import List
from app.models.schemas import UIFieldSchema

router = APIRouter(prefix="/schema", tags=["Schema"])

# Standard contract definition
BASE_SCHEMA: List[UIFieldSchema] = [
    UIFieldSchema(
        key="Structure_Type",
        label="Structure Type",
        ui_type="select",
        default="Plate Girder Bridge",
        options=["Plate Girder Bridge"],
        group="Type of Structure",
        container="main",
        required=True
    ),
    UIFieldSchema(
        key="Project_Location",
        label="Project Location",
        ui_type="button",
        default="Not Selected",
        action="open_project_location_modal",
        group="Project Location",
        container="main",
        required=True
    ),
    UIFieldSchema(
        key="Span",
        label="Span Length",
        ui_type="number",
        default=30.0,
        min=12.0,
        max=60.0,
        unit="m",
        placeholder="12–60 m",
        group="Geometric Details",
        container="superstructure",
        required=True
    ),
    UIFieldSchema(
        key="Carriageway_Width",
        label="Carriageway Width",
        ui_type="number",
        default=7.5,
        min=4.25,
        max=24.0,
        unit="m",
        placeholder="e.g. 7.5 m",
        group="Geometric Details",
        container="superstructure",
        required=True
    ),
    UIFieldSchema(
        key="Include_Median",
        label="Include Median",
        ui_type="select",
        default="No",
        options=["No", "Yes"],
        group="Geometric Details",
        container="superstructure",
        required=False
    ),
    UIFieldSchema(
        key="Skew_Angle",
        label="Skew Angle",
        ui_type="number",
        default=0.0,
        min=0.0,
        max=45.0,
        unit="°",
        placeholder="0–45°",
        group="Geometric Details",
        container="superstructure",
        required=False
    ),
    UIFieldSchema(
        key="No_Of_Girders",
        label="Number of Girders",
        ui_type="number",
        default=4,
        min=2,
        max=12,
        group="Girder Configuration",
        container="superstructure",
        required=True
    ),
    UIFieldSchema(
        key="Girder_Steel_Material",
        label="Girder Steel Grade",
        ui_type="select",
        default="E 250 (Fe 410 W) A",
        options=["E 250 (Fe 410 W) A", "E 250 (Fe 410 W) B", "E 300 (Fe 440) W", "E 350 (Fe 490)"],
        group="Materials",
        container="superstructure",
        required=True
    ),
    UIFieldSchema(
        key="Deck_Concrete_Material",
        label="Deck Concrete Grade",
        ui_type="select",
        default="M 35",
        options=["M 35", "M 40", "M 45", "M 50"],
        group="Materials",
        container="superstructure",
        required=True
    ),
]

@router.get("/basic", response_model=List[UIFieldSchema])
@router.get("", response_model=List[UIFieldSchema])
def get_basic_input_schema():
    """
    Returns the schema-driven definition of input fields for the Input Dock.
    TODO: Dynamically serialize from ui_fields.py
    """
    return BASE_SCHEMA
