package config

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// FileConfig handles file-based configuration operations
type FileConfig struct {
	path string
}

// NewFileConfig creates a new file configuration handler
func NewFileConfig(path string) *FileConfig {
	return &FileConfig{path: path}
}

// Exists checks if configuration file exists
func (f *FileConfig) Exists() bool {
	if _, err := os.Stat(f.path); os.IsNotExist(err) {
		return false
	}
	return true
}

// EnsureDir ensures the configuration directory exists
func (f *FileConfig) EnsureDir() error {
	dir := filepath.Dir(f.path)
	return os.MkdirAll(dir, 0755)
}

// Backup creates a backup of the configuration file
func (f *FileConfig) Backup() error {
	if !f.Exists() {
		return fmt.Errorf("configuration file does not exist: %s", f.path)
	}

	backupPath := f.path + ".backup." + time.Now().Format("20060102-150405")

	data, err := os.ReadFile(f.path)
	if err != nil {
		return fmt.Errorf("failed to read config for backup: %w", err)
	}

	if err := os.WriteFile(backupPath, data, 0600); err != nil {
		return fmt.Errorf("failed to create backup: %w", err)
	}

	return nil
}

// Restore restores configuration from backup
func (f *FileConfig) Restore(backupPath string) error {
	data, err := os.ReadFile(backupPath)
	if err != nil {
		return fmt.Errorf("failed to read backup file: %w", err)
	}

	if err := f.EnsureDir(); err != nil {
		return fmt.Errorf("failed to ensure config directory: %w", err)
	}

	if err := os.WriteFile(f.path, data, 0600); err != nil {
		return fmt.Errorf("failed to restore config: %w", err)
	}

	return nil
}

// ListBackups lists available backup files
func (f *FileConfig) ListBackups() ([]string, error) {
	dir := filepath.Dir(f.path)
	base := filepath.Base(f.path)

	files, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("failed to read config directory: %w", err)
	}

	var backups []string
	for _, file := range files {
		name := file.Name()
		// Check if file matches backup pattern
		if len(name) > len(base)+7 && name[:len(base)] == base && name[len(base):len(base)+7] == ".backup." {
			fullPath := filepath.Join(dir, name)
			backups = append(backups, fullPath)
		}
	}

	return backups, nil
}

// CleanupBackups removes old backup files (keeping only the latest N)
func (f *FileConfig) CleanupBackups(keep int) error {
	backups, err := f.ListBackups()
	if err != nil {
		return err
	}

	if len(backups) <= keep {
		return nil
	}

	// Sort by modification time (newest first) and remove oldest
	// For simplicity, just remove the oldest ones
	for i := keep; i < len(backups); i++ {
		if err := os.Remove(backups[i]); err != nil {
			// Log error but continue
			fmt.Fprintf(os.Stderr, "Warning: failed to remove backup %s: %v\n", backups[i], err)
		}
	}

	return nil
}

// GetModTime returns the modification time of the configuration file
func (f *FileConfig) GetModTime() (time.Time, error) {
	info, err := os.Stat(f.path)
	if err != nil {
		return time.Time{}, err
	}
	return info.ModTime(), nil
}

// GetSize returns the size of the configuration file
func (f *FileConfig) GetSize() (int64, error) {
	info, err := os.Stat(f.path)
	if err != nil {
		return 0, err
	}
	return info.Size(), nil
}

// IsWritable checks if the configuration file is writable
func (f *FileConfig) IsWritable() bool {
	file, err := os.OpenFile(f.path, os.O_WRONLY, 0600)
	if err != nil {
		return false
	}
	file.Close()
	return true
}
