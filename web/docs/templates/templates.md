# Writing templates

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

**To be implemented**
- [Templates can be referenced only from git, and cannot be fetched from a Helm repo](https://github.com/cyclops-ui/cyclops/issues/74)
- [Helm chart dependencies are not yet supported](https://github.com/cyclops-ui/cyclops/issues/75)

:::

## Helm schema

As mentioned, Cyclops renders its UI based on the JSON schema. JSON schema provides some fields to help with validations. Those fields are listed below, as well as whether or not Cyclops currently supports those.

### Strings

[JSON schema reference](https://json-schema.org/understanding-json-schema/reference/string)

| Name        | Description                                                                                        | Supported          | 
|:------------|----------------------------------------------------------------------------------------------------|--------------------|
| `minLength` | minimum length of the field value                                                                  | :white_check_mark: |
| `maxLength` | minimum length of the field value                                                                  | :white_check_mark: | 
| `pattern`   | restrict a string to a particular regular expression                                               | :x:                |
| `format`    | allows for basic semantic identification of certain kinds of string values that are commonly used  | :x:                |

<hr/>

### Numeric

[JSON schema reference](https://json-schema.org/understanding-json-schema/reference/numeric)

| Name               | Description                         | Supported          | 
|:-------------------|-------------------------------------|--------------------|
| `minimum`          | minimum field value                 | :white_check_mark: |
| `maximum`          | maximum field value                 | :white_check_mark: |
| `exclusiveMinimum` | exclusive minimum field value       | :x:                |
| `exclusiveMaximum` | exclusive minimum field value       | :x:                |
| `multipleOf`       | field value has to be a multiple of | :white_check_mark: |
