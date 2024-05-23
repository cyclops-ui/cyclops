package utility

import "encoding/base64"

// EncodeBase64 encodes a string to Base64.
func EncodeBase64(str string) string {
	return base64.StdEncoding.EncodeToString([]byte(str))
}

// DecodeBase64 decodes a Base64 encoded string to its original value.
func DecodeBase64(encodedStr string) (string, error) {
	decoded, err := base64.StdEncoding.DecodeString(encodedStr)
	if err != nil {
		return "", err
	}
	return string(decoded), nil
}
