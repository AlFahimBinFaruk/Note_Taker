from typing import List
from .models import Note
from .schemas import NoteCreate, NoteRead
from fastapi import HTTPException

async def create_note(note: NoteCreate, user_id: int) -> NoteRead:
    try:
        note=Note(
        **note.model_dump(),
        user_id=user_id
        )
        await note.insert()
        return note
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def get_user_notes(user_id: int) -> List[NoteRead]:
    try:
        notes=await Note.find(Note.user_id==user_id).sort(-Note.created_at).to_list()
        return [NoteRead.model_validate(note) for note in notes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

