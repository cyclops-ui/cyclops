export function fileExtension(fileExt: string): string {
    switch (fileExt) {
        case "json":
            return "json"
        case "sh":
            return "sh"
        case "yaml":
            return "yaml"
        case "toml":
            return "toml"
        case "javascript":
            return "javascript"
        case "typescript":
            return "typescript"
        default:
            return "text"
    }
}
