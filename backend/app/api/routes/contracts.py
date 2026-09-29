from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["Web API Contracts"])


@router.get("/sections/rolled")
def get_rolled_sections():
    return []


@router.post("/cad/3d-parameters")
def get_3d_cad_parameters():
    raise HTTPException(
        status_code=501,
        detail="3D CAD parameter generation is not implemented by the web API yet.",
    )