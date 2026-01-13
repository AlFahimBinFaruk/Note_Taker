package models

// in Golang DB schemas are just struct.

import (
	"time"

	"github.com/google/uuid"
)

type Note struct {
	ID        uuid.UUID `json:"id" gorm: "primaryKey;type:uuid;default:uuid_generate_v4()"`
	UserID    uuid.UUID `json:user_id gorm:"type:uuid;not null"`
	Title     string    `json:"title" gorm:"not null;size:255"`
	Content   string    `json:"content" gorm:"type:text"`
	CreatedAt time.Time `json:created_at`
	UpdatedAt time.Time `json:updated_at`
}

type CreateNoteRequest struct {
	UserID  uuid.UUID `json:"user_id" binding:"required"`
	Title   string    `json:"title" binding:"required"`
	Content string    `json:"content"`
}

type UpdateNoteRequest struct {
	Title   *string `json:"title"`
	Content *string `json:"content"`
}
