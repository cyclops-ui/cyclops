---
title: Validation
---

# Helm Schema Validation

Cyclops renders its UI based on the Helm chart JSON schema. JSON schema provides some fields to help with validations. Those fields are listed below, as well as whether or not Cyclops currently supports those.

## Strings

[JSON schema reference](https://json-schema.org/understanding-json-schema/reference/string)

| Name        | Description                                                                                       | Supported          |
| :---------- | ------------------------------------------------------------------------------------------------- | ------------------ |
| `minLength` | minimum length of the field value                                                                 | :white_check_mark: |
| `maxLength` | minimum length of the field value                                                                 | :white_check_mark: |
| `pattern`   | restrict a string to a particular regular expression                                              | :white_check_mark: |
| `format`    | allows for basic semantic identification of certain kinds of string values that are commonly used | :x:                |

<hr/>

## Numeric

[JSON schema reference](https://json-schema.org/understanding-json-schema/reference/numeric)

| Name               | Description                         | Supported          |
| :----------------- | ----------------------------------- | ------------------ |
| `minimum`          | minimum field value                 | :white_check_mark: |
| `maximum`          | maximum field value                 | :white_check_mark: |
| `exclusiveMinimum` | exclusive minimum field value       | :white_check_mark: |
| `exclusiveMaximum` | exclusive minimum field value       | :white_check_mark: |
| `multipleOf`       | field value has to be a multiple of | :white_check_mark: |
