package template

import (
	"fmt"
	"sort"

	"github.com/Masterminds/semver/v3"
	"github.com/pkg/errors"
)

func isValidVersion(v string) bool {
	_, err := semver.StrictNewVersion(v)
	return err == nil
}

func resolveSemver(targetVersion string, versions []string) (string, error) {
	contstraints, err := semver.NewConstraint(targetVersion)
	if err != nil {
		return "", nil
	}

	validVersions, err := filterVersions(versions, contstraints)
	if err != nil {
		return "", err
	}

	sort.Sort(sort.Reverse(semver.Collection(validVersions)))

	if len(validVersions) == 0 {
		return "", errors.New(fmt.Sprintf("no valid versions for %v", targetVersion))
	}

	return validVersions[0].String(), nil
}

func filterVersions(versions []string, constraint *semver.Constraints) ([]*semver.Version, error) {
	validVersions := make([]*semver.Version, 0)

	for _, v := range versions {
		parsedVersion, err := semver.NewVersion(v)
		if err != nil {
			continue
		}

		if constraint.Check(parsedVersion) {
			validVersions = append(validVersions, parsedVersion)
		}
	}

	return validVersions, nil
}
