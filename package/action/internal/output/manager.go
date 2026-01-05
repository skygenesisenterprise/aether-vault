package output

import (
	"fmt"
	"os"

	"github.com/sirupsen/logrus"
)

type Manager struct {
	logger *logrus.Logger
}

func NewManager(logger *logrus.Logger) *Manager {
	return &Manager{
		logger: logger,
	}
}

func (m *Manager) SetOutput(name, value string) error {
	outputFile := fmt.Sprintf("/github/workspace/output_%s.txt", name)

	if err := os.WriteFile(outputFile, []byte(value), 0644); err != nil {
		m.logger.WithError(err).Errorf("Failed to write output file %s", name)
		return err
	}

	fmt.Printf("::set-output name=%s::%s\n", name, value)

	m.logger.WithFields(logrus.Fields{
		"name":  name,
		"value": value,
	}).Info("Output set successfully")

	return nil
}

func (m *Manager) SetOutputs(outputs map[string]string) error {
	for name, value := range outputs {
		if err := m.SetOutput(name, value); err != nil {
			return fmt.Errorf("failed to set output %s: %w", name, err)
		}
	}
	return nil
}
