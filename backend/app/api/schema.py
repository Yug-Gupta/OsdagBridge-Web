from fastapi import APIRouter
from typing import List
from app.models.schemas import UIFieldSchema
import sys
from pathlib import Path

# Add core src to path if running side-by-side with OsdagBridge
CORE_DIR = Path(__file__).resolve().parents[4] / "osdag-admin_OsdagBridge_dev" / "OsdagBridge" / "src"
if CORE_DIR.exists() and str(CORE_DIR) not in sys.path:
    sys.path.insert(0, str(CORE_DIR))

router = APIRouter(prefix="/schema", tags=["Schema"])
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
