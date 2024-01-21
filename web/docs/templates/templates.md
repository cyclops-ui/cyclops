# Overview

You can create your own template UIs by creating a helm template and pushing to a git repository. Cyclops renders the
form based on the `values.schema.json` file. That file is used to define values structure in Helm. You can learn more
about it and learn how to create one by following [Helm docs](https://helm.sh/docs/topics/charts/#schema-files). The 
schema is represented as a [JSON Schema](https://json-schema.org/)

You can find a list of all the fields you can set below for each field type.

On top of the usual schema, we added some more fields to help our users get as much from the UI.

| Name            | Type         | Description                                                                                                                                                                       | Valid input                                                      |
|:----------------|--------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `order`         | string array | Defines the order of the fields in an object type property. <br/> Basically each time you use `properties`, you should also define the order of those properties                  | -                                                                |
| `fileExtension` | string       | Sometimes you would like your text field not to be just a field, but also to get some highlighting based on the type of string you are saving. You can specify that in this field | `text`, `sh`, `json`, `yaml`, `toml`, `javascript`, `typescript` |

<br/>
:::info

Version [ v0.0.1-alpha.9 ](https://github.com/cyclops-ui/cyclops/releases/tag/v0.0.1-alpha.9) supports templates fetched from a Helm chart repo and OCI based charts

:::
