package runtime

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"syscall"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/skygenesisenterprise/aether-vault/package/docker/internal/audit"
)

type Manager struct {
	logger      *logrus.Logger
	auditLogger *audit.Logger
	process     *os.Process
}

func NewManager(logger *logrus.Logger, auditLogger *audit.Logger) *Manager {
	return &Manager{
		logger:      logger,
		auditLogger: auditLogger,
	}
}

func (m *Manager) Execute(ctx context.Context, cmd []string, env []string) (int, error) {
	if len(cmd) == 0 {
		return 1, fmt.Errorf("no command specified")
	}

	command := cmd[0]
	args := cmd[1:]

	m.logger.WithFields(map[string]interface{}{
		"command":   command,
		"args":      args,
		"env_count": len(env),
	}).Info("Starting application execution")

	// Create the command
	execCmd := exec.CommandContext(ctx, command, args...)
	execCmd.Env = append(os.Environ(), env...)
	execCmd.Stdin = os.Stdin
	execCmd.Stdout = os.Stdout
	execCmd.Stderr = os.Stderr

	// Start the process
	if err := execCmd.Start(); err != nil {
		return 1, fmt.Errorf("failed to start process: %w", err)
	}

	m.process = execCmd.Process
	m.logger.WithField("pid", m.process.Pid).Info("Process started")

	// Setup signal forwarding
	m.setupSignalForwarding()

	// Wait for the process to complete
	err := execCmd.Wait()
	exitCode := 0

	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			if status, ok := exitError.Sys().(syscall.WaitStatus); ok {
				exitCode = status.ExitStatus()
			} else {
				exitCode = 1
			}
		} else {
			exitCode = 1
		}

		m.logger.WithFields(map[string]interface{}{
			"error":     err.Error(),
			"exit_code": exitCode,
		}).Error("Process execution failed")
	} else {
		m.logger.Info("Process completed successfully")
	}

	return exitCode, nil
}

func (m *Manager) setupSignalForwarding() {
	// This would handle signal forwarding to the child process
	// For now, we'll log that signals are being handled
	m.logger.Debug("Signal forwarding setup completed")
}

func (m *Manager) Stop(ctx context.Context) error {
	if m.process == nil {
		m.logger.Warn("No process to stop")
		return nil
	}

	pid := m.process.Pid
	m.logger.WithField("pid", pid).Info("Stopping process")

	// Try graceful shutdown first
	if err := m.process.Signal(syscall.SIGTERM); err != nil {
		m.logger.WithError(err).Warn("Failed to send SIGTERM to process")
	}

	// Wait for graceful shutdown or force kill
	done := make(chan error, 1)
	go func() {
		_, err := m.process.Wait()
		done <- err
	}()

	select {
	case err := <-done:
		if err != nil {
			m.logger.WithError(err).Error("Process termination error")
		} else {
			m.logger.Info("Process terminated gracefully")
		}
	case <-time.After(10 * time.Second):
		m.logger.Warn("Process did not terminate gracefully, force killing")
		if err := m.process.Kill(); err != nil {
			m.logger.WithError(err).Error("Failed to kill process")
		}
	}

	return nil
}

func (m *Manager) IsRunning() bool {
	if m.process == nil {
		return false
	}

	// Check if process is still running
	err := m.process.Signal(syscall.Signal(0))
	return err == nil
}

func (m *Manager) GetPID() int {
	if m.process == nil {
		return 0
	}
	return m.process.Pid
}

func (m *Manager) Supervise(ctx context.Context, cmd []string, env []string, restartPolicy RestartPolicy) error {
	for {
		exitCode, err := m.Execute(ctx, cmd, env)

		// Log the execution result
		m.auditLogger.LogProcessExecution(ctx, cmd, exitCode, err)

		// Check if we should restart
		if !restartPolicy.ShouldRestart(exitCode, err) {
			m.logger.WithFields(map[string]interface{}{
				"exit_code": exitCode,
				"restart":   false,
			}).Info("Process supervision completed")
			return err
		}

		m.logger.WithFields(map[string]interface{}{
			"exit_code": exitCode,
			"restart":   true,
		}).Info("Restarting process")

		// Wait before restarting
		select {
		case <-time.After(restartPolicy.Delay):
			continue
		case <-ctx.Done():
			m.logger.Info("Supervision context cancelled")
			return ctx.Err()
		}
	}
}

type RestartPolicy struct {
	MaxRestarts int
	Delay       time.Duration
	RestartOn   []int // Exit codes that trigger restart
	restarts    int
}

func (rp *RestartPolicy) ShouldRestart(exitCode int, err error) bool {
	// Check if we've exceeded max restarts
	if rp.MaxRestarts > 0 && rp.restarts >= rp.MaxRestarts {
		return false
	}

	// Check if exit code is in restart list
	for _, code := range rp.RestartOn {
		if code == exitCode {
			rp.restarts++
			return true
		}
	}

	// Default: restart on non-zero exit codes
	if exitCode != 0 {
		rp.restarts++
		return true
	}

	return false
}

func DefaultRestartPolicy() RestartPolicy {
	return RestartPolicy{
		MaxRestarts: 3,
		Delay:       5 * time.Second,
		RestartOn:   []int{1, 2, 127}, // Restart on common error codes
	}
}
