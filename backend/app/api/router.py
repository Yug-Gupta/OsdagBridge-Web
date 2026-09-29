from fastapi import APIRouter
from app.api.schema import router as schema_router
from app.api.validate import router as validate_router
from app.api.location import router as location_router
from app.api.routes.schemas import router as additional_schema_router
from app.api.routes.materials import router as materials_router
from app.api.routes.contracts import router as contracts_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(schema_router)
api_router.include_router(validate_router)
api_router.include_router(location_router)
api_router.include_router(additional_schema_router)
api_router.include_router(materials_router)
api_router.include_router(contracts_router)
