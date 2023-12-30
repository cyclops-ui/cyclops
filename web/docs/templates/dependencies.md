---
title: Helm chart dependencies
---

# Helm chart dependencies

:::info

Supported from [ v0.0.1-alpha.7 ](https://github.com/cyclops-ui/cyclops/releases/tag/v0.0.1-alpha.7)

:::

This part will go over how Cyclops implements Helm chart dependencies. You can find out more about chart dependencies on [Helm docs](https://helm.sh/docs/helm/helm_dependency/).

Dependencies allow us to reference another Helm chart and use it in the context of our application without having to configure multiple deployments separately.

For instance, you might want to deploy an application that uses Redis as its cache storage, but you don't want to add all of those resources for a Redis deployment into your template. You can simply add a Redis Helm chart as a dependency to your application chart and get your Redis up and running in the same chart as your app.

Since Helm supports dependencies, it makes sense that Cyclops also supports them. You can reference dependencies in the `Chart.yaml` of your root template if you want to use dependencies. Refer to Helm docs for more info on how to do it, but here is an [example](https://github.com/cyclops-ui/templates/blob/chart-deps/demo/Chart.yaml) of how to do it.

```yaml
# Chart.yaml

apiVersion: v1
name: application
version: 0.0.0
dependencies:
  - name: application
    version: "0.1.0"
    repository: "https://petar-cvit.github.io"
```

For each dependency you specify, Cyclops will render 
