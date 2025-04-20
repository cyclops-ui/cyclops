package dto

import json "github.com/json-iterator/go"

type ExecIn struct {
	Command string `json:"command"`
}

type ExecOut struct {
	Output string `json:"output"`
}

func NewExecOutput(out string) *ExecOut {
	return &ExecOut{Output: out}
}

func (o *ExecOut) Bytes() ([]byte, error) {
	return json.Marshal(o)
}

func NewExecInput(p []byte) (*ExecIn, error) {
	var in *ExecIn
	if err := json.Unmarshal(p, &in); err != nil {
		return nil, err
	}

	return in, nil
}
