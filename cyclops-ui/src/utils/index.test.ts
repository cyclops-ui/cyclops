import { deepMerge, fileExtension } from "./form";

describe("fileExtension", () => {
  const testCases = [
    {
      in: "json",
      out: "json",
    },
    {
      in: "sh",
      out: "sh",
    },
    {
      in: "yaml",
      out: "yaml",
    },
    {
      in: "toml",
      out: "toml",
    },
    {
      in: "javascript",
      out: "javascript",
    },
    {
      in: "typescript",
      out: "typescript",
    },
    {
      in: "what",
      out: "text",
    },
  ];

  it("returns correct code highlight to text type", () => {
    for (let i = 0; i < testCases.length; i++) {
      expect(testCases[i].out).toBe(fileExtension(testCases[i].in));
    }
  });
});

describe("deepMerge", () => {
  const testCases = [
    {
      description: "both source and target empty",
      target: {},
      source: {},
      out: {},
    },
    {
      description: "null target",
      target: null,
      source: {},
      out: {},
    },
    {
      description: "null source",
      target: {},
      source: null,
      out: {},
    },
    {
      description: "both source and target null",
      target: null,
      source: null,
      out: {},
    },
    {
      description: "target undefined",
      target: undefined,
      source: {},
      out: {},
    },
    {
      description: "source undefined",
      target: {},
      source: undefined,
      out: {},
    },
    {
      description: "both source and target undefined",
      target: undefined,
      source: undefined,
      out: {},
    },
    {
      description: "target has fields",
      target: { name: "my-app" },
      source: {},
      out: { name: "my-app" },
    },
    {
      description: "field overlap",
      target: { name: "my-app" },
      source: { name: "another-app" },
      out: { name: "another-app" },
    },
    {
      description: "no field overlap",
      target: { name: "my-app" },
      source: { someField: "value" },
      out: { name: "my-app", someField: "value" },
    },
    {
      description: "nested fields, no overlap",
      target: { general: { image: "nginx", version: 3 } },
      source: { someField: "value" },
      out: { general: { image: "nginx", version: 3 }, someField: "value" },
    },
    {
      description: "both have nested fields, no overlap",
      target: { general: { image: "nginx", version: 3 } },
      source: {
        someField: "value",
        networking: { expose: true, host: "example.com", serviceType: "" },
      },
      out: {
        general: { image: "nginx", version: 3 },
        someField: "value",
        networking: { expose: true, host: "example.com", serviceType: "" },
      },
    },
    {
      description: "both have nested fields, no overlap, null value",
      target: { general: { image: "nginx", version: 3 } },
      source: {
        someField: "value",
        networking: { expose: true, host: "example.com", serviceType: null },
      },
      out: {
        general: { image: "nginx", version: 3 },
        someField: "value",
        networking: { expose: true, host: "example.com", serviceType: null },
      },
    },
    {
      description: "both have nested fields, no overlap, undefined value",
      target: { general: { image: "nginx", version: 3 } },
      source: {
        someField: "value",
        networking: {
          expose: true,
          host: "example.com",
          serviceType: undefined,
        },
      },
      out: {
        general: { image: "nginx", version: 3 },
        someField: "value",
        networking: {
          expose: true,
          host: "example.com",
          serviceType: undefined,
        },
      },
    },
    {
      description: "both have nested fields, overlap",
      target: { general: { image: "nginx", version: 3 } },
      source: {
        someField: "value",
        general: { image: "redis", version: 5 },
        networking: {
          expose: true,
          host: "example.com",
          serviceType: undefined,
        },
      },
      out: {
        general: { image: "redis", version: 5 },
        someField: "value",
        networking: {
          expose: true,
          host: "example.com",
          serviceType: undefined,
        },
      },
    },
    {
      description: "both have same nested fields",
      target: {
        someField: "value",
        general: { image: "redis", version: 5 },
        networking: {
          expose: true,
          host: "example.com",
          serviceType: undefined,
        },
      },
      source: {
        someField: "value",
        general: { image: "redis", version: 5 },
        networking: {
          expose: true,
          host: "example.com",
          serviceType: undefined,
        },
      },
      out: {
        someField: "value",
        general: { image: "redis", version: 5 },
        networking: {
          expose: true,
          host: "example.com",
          serviceType: undefined,
        },
      },
    },
    {
      description: "target has arrays",
      target: { myList: [1, 2, 3] },
      source: {},
      out: { myList: [1, 2, 3] },
    },
    {
      description: "source has arrays",
      target: {},
      source: { myList: [1, 2, 3] },
      out: { myList: [1, 2, 3] },
    },
    {
      description: "both have arrays",
      target: { myList: [4, 5, 6] },
      source: { myList: [1, 2, 3] },
      out: { myList: [1, 2, 3] },
    },
    {
      description: "target has empty array",
      target: { myList: [] },
      source: {},
      out: { myList: [] },
    },
    {
      description: "source has empty array",
      target: {},
      source: { myList: [] },
      out: { myList: [] },
    },
    {
      description: "both have empyt arrays",
      target: { myList: [] },
      source: { myList: [] },
      out: { myList: [] },
    },
    {
      description: "both have nested fields, target has arrays",
      target: {
        general: { image: "nginx", version: 3 },
        myList: ["here", "I", "am"],
      },
      source: {
        someField: "value",
        networking: {
          expose: true,
          host: "example.com",
          serviceType: undefined,
        },
      },
      out: {
        general: { image: "nginx", version: 3 },
        someField: "value",
        networking: {
          expose: true,
          host: "example.com",
          serviceType: undefined,
        },
        myList: ["here", "I", "am"],
      },
    },
    {
      description: "both have nested fields, source has arrays",
      target: { general: { image: "nginx", version: 3 } },
      source: {
        someField: "value",
        networking: {
          expose: true,
          host: "example.com",
          serviceType: undefined,
        },
        myList: ["am", "I", "here"],
      },
      out: {
        general: { image: "nginx", version: 3 },
        someField: "value",
        networking: {
          expose: true,
          host: "example.com",
          serviceType: undefined,
        },
        myList: ["am", "I", "here"],
      },
    },
  ];

  testCases.forEach((testCase) => {
    it(testCase.description, () => {
      expect(deepMerge(testCase.target, testCase.source)).toStrictEqual(
        testCase.out,
      );
    });
  });
});
