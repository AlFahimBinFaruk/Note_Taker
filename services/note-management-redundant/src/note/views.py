from fastapi import APIRouter, Depends, HTTPException
from typing import List
from .schemas import NoteCreate, NoteRead
from .services import create_note, get_user_notes
from ..core.dependencies import get_current_user


router = APIRouter(prefix="/notes", tags=["Notes"])


@router.post("/create", response_model=NoteRead)
async def create_note(
    note: NoteCreate,
    user: dict = Depends(get_current_user),
):
    try:
        return await create_note(note, user["user_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/",response_model=List[NoteRead])
async def get_user_notes(
    user: dict = Depends(get_current_user),
):
    try:
        return await get_user_notes(user["user_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))