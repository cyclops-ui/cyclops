# Overview

Cyclops renders the _New Module_ form based on your Helm templates. We have a public [templates repository](https://github.com/cyclops-ui/templates) where we created a couple of charts you can use. Alternatively, you can create your own Helm charts and use them as templates.

Although we have a **GitHub repository** to store our charts, there are other ways of storing them. Cyclops can access charts stored in three different ways:

1. **1. GitHub Repository**
2. **2. Helm Chart Repository**
3. **3. OCI Repository**

The **`values.schema.json` is a necessary component** in your templates. This file is usually used to impose a structure on the `values.yaml` file, but it is also crucial for rendering the GUI in Cyclops.

You can learn more about it and how to create one by following [Helm docs](https://helm.sh/docs/topics/charts/#schema-files). The schema is represented as a [JSON Schema](https://json-schema.org/)

## Generating Helm chart schema

In case your Helm chart does not contain the `values.schema.json` file, you can generate it from your `values.yaml` file. One tool to help you with that is the [https://github.com/dadav/helm-schema](https://github.com/dadav/helm-schema) which can be installed and used as a CLI tool.

You can install it using the following command:
```shell
go install github.com/dadav/helm-schema/cmd/helm-schema@latest
```

You can now generate your schema:
```shell
helm-schema --chart-search-root <path to your chart>
```

You can also add more properties to each value (type, validations, enums…) by adding annotations in the `values.yaml` comments. [Check here](https://github.com/dadav/helm-schema?tab=readme-ov-file#annotations)

The tool will generate the `values.schema.json` which you can add to your chart and import the chart into Cyclops to get your fully functional Kubernetes UI.

In addition to the usual schema, we added more fields to help our users get as much from the UI as possible.

| Name            | Type         | Description                                                                                                                                                                       | Valid input                                                      |
|:----------------|--------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `order`         | string array | Defines the order of the fields in an object type property. <br/> Each time you use `properties`, you should also define the order of those properties                            | -                                                                |
| `fileExtension` | string       | Sometimes, you would like your text field not just to be a field but also to get some highlighting based on the type of string you are saving. You can specify that in this field | `text`, `sh`, `json`, `yaml`, `toml`, `javascript`, `typescript` |
| `immutable`     | boolean      | If `true`, the field can't be updated through the UI when __editing__ a module. Can be edited when the Module is first created or via manifest in the cluster.                    | `true`, `false` (`false` by default)                             |

