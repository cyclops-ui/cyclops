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

type Response struct {
	Message string `json:"message"`
}

func NewResponse(message string) Response {
	return Response{
		Message: message,
	}
}
