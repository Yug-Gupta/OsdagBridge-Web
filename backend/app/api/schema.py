from fastapi import APIRouter
from typing import List
from app.models.schemas import UIFieldSchema
import sys
from pathlib import Path

# Add core src to path if running side-by-side with OsdagBridge
CORE_DIR = Path(__file__).resolve().parents[4] / "osdag-admin_OsdagBridge_dev" / "OsdagBridge" / "src"

print("CORE_DIR =", CORE_DIR)
print("CORE EXISTS =", CORE_DIR.exists())

if CORE_DIR.exists() and str(CORE_DIR) not in sys.path:
    sys.path.insert(0, str(CORE_DIR))



router = APIRouter(prefix="/schema", tags=["Schema"])

# Standard contract definition
# # BASE_SCHEMA: List[UIFieldSchema] = [
#     UIFieldSchema(
#         key="Structure_Type",
#         label="Structure Type",
#         ui_type="select",
#         default="Plate Girder Bridge",
#         options=["Plate Girder Bridge"],
#         group="Type of Structure",
#         container="main",
#         required=True
#     ),
#     UIFieldSchema(
#         key="Project_Location",
#         label="Project Location",
#         ui_type="button",
#         default="Not Selected",
#         action="open_project_location_modal",
#         group="Project Location",
#         container="main",
#         required=True
#     ),
#     UIFieldSchema(
#         key="Span",
#         label="Span Length",
#         ui_type="number",
#         default=30.0,
#         min=12.0,
#         max=60.0,
#         unit="m",
#         placeholder="12–60 m",
#         group="Geometric Details",
#         container="superstructure",
#         required=True
#     ),
#     UIFieldSchema(
#         key="Carriageway_Width",
#         label="Carriageway Width",
#         ui_type="number",
#         default=7.5,
#         min=4.25,
#         max=24.0,
#         unit="m",
#         placeholder="e.g. 7.5 m",
#         group="Geometric Details",
#         container="superstructure",
#         required=True
#     ),
#     UIFieldSchema(
#         key="Include_Median",
#         label="Include Median",
#         ui_type="select",
#         default="No",
#         options=["No", "Yes"],
#         group="Geometric Details",
#         container="superstructure",
#         required=False
#     ),
#     UIFieldSchema(
#         key="Skew_Angle",
#         label="Skew Angle",
#         ui_type="number",
#         default=0.0,
#         min=0.0,
#         max=45.0,
#         unit="°",
#         placeholder="0–45°",
#         group="Geometric Details",
#         container="superstructure",
#         required=False
#     ),
#     UIFieldSchema(
#         key="No_Of_Girders",
#         label="Number of Girders",
#         ui_type="number",
#         default=4,
#         min=2,
#         max=12,
#         group="Girder Configuration",
#         container="superstructure",
#         required=True
#     ),
#     UIFieldSchema(
#         key="Girder_Steel_Material",
#         label="Girder Steel Grade",
#         ui_type="select",
#         default="E 250 (Fe 410 W) A",
#         options=["E 250 (Fe 410 W) A", "E 250 (Fe 410 W) B", "E 300 (Fe 440) W", "E 350 (Fe 490)"],
#         group="Materials",
#         container="superstructure",
#         required=True
#     ),
#     UIFieldSchema(
#         key="Deck_Concrete_Material",
#         label="Deck Concrete Grade",
#         ui_type="select",
#         default="M 35",
#         options=["M 35", "M 40", "M 45", "M 50"],
#         group="Materials",
#         container="superstructure",
#         required=True
#     ),
# ]

@router.get("", response_model=List[UIFieldSchema])
def get_basic_input_schema():
    """
    Returns the schema-driven definition of input fields for the Input Dock.
    """
    try:

        '''
            Field Observations:
                unit property is only there for type textbox
                options property is only there for dropdown/combox type
                all keys in the BASIC_INPUT_DICT have a deafult value
        '''
        from osdagbridge.core.bridge_types.plate_girder.ui_fields import FrontendData
        from osdagbridge.core.bridge_types.plate_girder.defaults import BASIC_INPUT_DICT

        print("FrontendData =", FrontendData)
        print("BASIC_INPUT_DICT =", BASIC_INPUT_DICT)

        fields = FrontendData().input_values()
        NEW_SCHEMA: List[UIFieldSchema] = []
        for field in fields:

            common_schema_data = {  #these properties are common to all ui fields 
                "id": field[0],
                "label": field[1],
                "type": field[2]
            }

            #Below as per the conditions values are omitted or included in the schema data
            
            #condition 1: All fields in BASIC_INPUT_DICT have a default value
            if(field[0] in BASIC_INPUT_DICT): 
                common_schema_data["default_value"] = BASIC_INPUT_DICT[field[0]]

            #condition 2: If type is combobox then include options property
            if(field[2] == "combobox"):
                common_schema_data["options"] = field[3]

            #condition 3: If type is textbox then include unit property
            if(field[2] == "textbox"):
                common_schema_data["unit"] = "m"

            #As all values need to be included, unpack the dictionary and append into NEW_SCHEMA
            NEW_SCHEMA.append(UIFieldSchema(**common_schema_data))
    except ImportError as e:
        print("CORE IMPORT ERROR:", e)
        raise
    return NEW_SCHEMA
