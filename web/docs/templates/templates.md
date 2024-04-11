# Overview

Cyclops renders the _New Module_ form based on your Helm templates. We have a public [templates repository](https://github.com/cyclops-ui/templates) where we created a couple of charts you can use. Alternatively, you can create your own Helm charts and use them as templates.

Although we have a **GitHub repository** to store our charts, there are other ways of storing them. Cyclops can access charts stored in three different ways:

1. **1. GitHub Repository**
2. **2. Helm Chart Repository**
3. **3. OCI Repository**

The **`values.schema.json` is a necessary component** in your templates. This file is usually used to impose a structure on the `values.yaml` file, but it is also crucial for rendering the GUI in Cyclops.

You can learn more about it and how to create one by following [Helm docs](https://helm.sh/docs/topics/charts/#schema-files). The schema is represented as a [JSON Schema](https://json-schema.org/)

You can find a list of all the fields you can set below for each field type.

In addition to the usual schema, we added more fields to help our users get as much from the UI as possible.

| Name            | Type         | Description                                                                                                                                                                       | Valid input                                                      |
| :-------------- | ------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `order`         | string array | Defines the order of the fields in an object type property. <br/> Each time you use `properties`, you should also define the order of those properties                            | -                                                                |
| `fileExtension` | string       | Sometimes, you would like your text field not just to be a field but also to get some highlighting based on the type of string you are saving. You can specify that in this field | `text`, `sh`, `json`, `yaml`, `toml`, `javascript`, `typescript` |
