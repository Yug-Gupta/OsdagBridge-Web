from fastapi import APIRouter

from osdagbridge.core.bridge_types.plate_girder.ui_fields_additional_input import (
    _DECK_DETAILS_TAB_SCHEMA as LAYOUT_TAB_SCHEMA,
    _CRASH_BARRIER_TAB_SCHEMA as CRASH_BARRIER_TAB_SCHEMA,
    _MEDIAN_TAB_SCHEMA as MEDIAN_TAB_SCHEMA,
    _RAILING_TAB_SCHEMA as RAILING_TAB_SCHEMA,
    _WEARING_COURSE_TAB_SCHEMA as WEARING_COURSE_TAB_SCHEMA,
    _LANE_DETAILS_TAB_SCHEMA as LANE_DETAILS_TAB_SCHEMA,
    _PERMANENT_LOAD_TAB_SCHEMA as PERMANENT_LOAD_TAB_SCHEMA,
    _LIVE_LOAD_TAB_SCHEMA as LIVE_LOAD_TAB_SCHEMA,
    _SEISMIC_LOAD_TAB_SCHEMA as SEISMIC_LOAD_TAB_SCHEMA,
    _WIND_LOAD_TAB_SCHEMA as WIND_LOAD_TAB_SCHEMA,
    _TEMPERATURE_LOAD_TAB_SCHEMA as TEMPERATURE_LOAD_TAB_SCHEMA,
    _CUSTOM_LOAD_TAB_SCHEMA as CUSTOM_LOAD_TAB_SCHEMA,
    _LOAD_COMBINATION_TAB_SCHEMA as LOAD_COMBINATION_TAB_SCHEMA,
    SUPPORT_CONDITIONS_SCHEMA,
    DESIGN_OPTIONS_SCHEMA,
    DESIGN_OPTIONS_CONT_SCHEMA,
    GIRDER_DETAILS_SCHEMA,
    STIFFENER_DETAILS_SCHEMA,
    CROSS_BRACING_DETAILS_SCHEMA,
    END_DIAPHRAGM_DETAILS_SCHEMA,
    MEMBER_PROPERTIES_SCHEMA as MEMBER_PROPERTIES_SCHEMA_V1,
)

router = APIRouter(prefix="/schemas", tags=["Schemas"])

@router.get("/")
def get_all_schemas():
    """
    Returns all UI schemas required by the Additional Inputs dialog.
    The frontend uses these to dynamically render forms.
    """
    return {
        "layout_tab": LAYOUT_TAB_SCHEMA,
        "crash_barrier_tab": CRASH_BARRIER_TAB_SCHEMA,
        "median_tab": MEDIAN_TAB_SCHEMA,
        "railing_tab": RAILING_TAB_SCHEMA,
        "wearing_course_tab": WEARING_COURSE_TAB_SCHEMA,
        "lane_details_tab": LANE_DETAILS_TAB_SCHEMA,
        "permanent_load_tab": PERMANENT_LOAD_TAB_SCHEMA,
        "live_load_tab": LIVE_LOAD_TAB_SCHEMA,
        "seismic_load_tab": SEISMIC_LOAD_TAB_SCHEMA,
        "wind_load_tab": WIND_LOAD_TAB_SCHEMA,
        "temperature_load_tab": TEMPERATURE_LOAD_TAB_SCHEMA,
        "custom_load_tab": CUSTOM_LOAD_TAB_SCHEMA,
        "load_combination_tab": LOAD_COMBINATION_TAB_SCHEMA,
        "support_conditions_tab": SUPPORT_CONDITIONS_SCHEMA,
        "design_options_tab": DESIGN_OPTIONS_SCHEMA,
        "design_options_cont_tab": DESIGN_OPTIONS_CONT_SCHEMA,
        "girder_details": GIRDER_DETAILS_SCHEMA,
        "stiffener_details": STIFFENER_DETAILS_SCHEMA,
        "cross_bracing_details": CROSS_BRACING_DETAILS_SCHEMA,
        "end_diaphragm_details": END_DIAPHRAGM_DETAILS_SCHEMA,
        "member_properties_v1": MEMBER_PROPERTIES_SCHEMA_V1,
    }
