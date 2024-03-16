import {fileExtension} from "./form";

describe("fileExtension", () => {
    const testCases = [
        {
            in: "json",
            out: "json"
        },
        {
            in: "sh",
            out: "sh"
        },
        {
            in: "yaml",
            out: "yaml"
        },
        {
            in: "toml",
            out: "toml"
        },
        {
            in: "javascript",
            out: "javascript"
        },
        {
            in: "typescript",
            out: "typescript"
        },
        {
            in: "what",
            out: "text"
        },
    ]

    it("maps correct code highlight to text type", () => {
        for (let i = 0; i < testCases.length; i++) {
            expect(testCases[i].out).toBe(fileExtension(testCases[i].in))
        }
    })
});
