package database

import (
	"fmt"
	"log"
	"note-management/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect(cfg config.Config) *gorm.DB {
	// Data source name
	dsn := fmt.Sprintf(
		"host:%s port:%s password:%s dbname:%s sslmode=disable",
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBPassword,
		cfg.DBName,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatalf("Failed to connect to Database: %v", err)
	}
	log.Println("Successfully Connected to Database")

	return db
}
