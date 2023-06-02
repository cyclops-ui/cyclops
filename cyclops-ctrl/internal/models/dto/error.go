package dto

type Error struct {
	Message     string `json:"message"`
	Description string `json:"description"`
}

func NewError(message, description string) Error {
	return Error{
		Message:     message,
		Description: description,
	}
}
