package providers

import (
	"testing"

	awssdk "github.com/Amaan0907/Revokr/internal/aws"
	"github.com/Amaan0907/Revokr/internal/providers/simulated"
)

func TestSelect_Simulated_ReturnsSimulatedAdapter(t *testing.T) {
	a := Select(true)

	if _, ok := a.(*simulated.Adapter); !ok {
		t.Fatalf("Select(true) = %T, want *simulated.Adapter", a)
	}
}

func TestSelect_NotSimulated_ReturnsAWSAdapter(t *testing.T) {
	a := Select(false)

	if _, ok := a.(*awssdk.Adapter); !ok {
		t.Fatalf("Select(false) = %T, want *aws.Adapter", a)
	}
}
